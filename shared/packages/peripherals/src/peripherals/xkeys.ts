import { AttentionLevel, KeyDisplay, LoggerLike, PeripheralId, PeripheralInfo, PeripheralType } from '@shared/api'
import { assertNever } from '@shared/lib'
import { isEqual } from 'lodash-es'
import { listAllConnectedPanels, XKeys, PRODUCTS, Product, HID_Device, setupXkeysPanel } from 'xkeys'
import { onKnownPeripheralCallback, Peripheral, WatchReturnType } from './peripheral.js'
import { protectString } from '@shared/models'

/** An X-keys value for how fast the keys should flash, when flashing Fast */
const FLASH_FAST = 7
/** An X-keys value for how fast the keys should flash, when flashing Slowly */
const FLASH_NORMAL = 30

export class PeripheralXkeys extends Peripheral {
	private static Watching = false
	private connectedToParent = false
	static Watch(this: void, onKnownPeripheral: onKnownPeripheralCallback): WatchReturnType {
		if (PeripheralXkeys.Watching) {
			throw new Error('Already watching')
		}

		PeripheralXkeys.Watching = true

		let lastSeenXkeysPanels: HID_Device[] = []

		// Check for new or removed Xkeys panels every second.
		const interval = setInterval(() => {
			// List the connected Xkeys panels.
			const connectedPanelInfos = listAllConnectedPanels()

			// If the list has not changed since the last poll, do nothing.
			if (isEqual(connectedPanelInfos, lastSeenXkeysPanels)) {
				return
			}

			// Figure out which Xkeys panels have been unplugged since the last check.
			const disconnectedXkeysPanelIds = new Set(
				lastSeenXkeysPanels.map(PeripheralXkeys.GetXkeysId).filter((id) => {
					return !connectedPanelInfos.some((p) => PeripheralXkeys.GetXkeysId(p) === id)
				})
			)

			// Figure out which Xkeys panels are being seen now that weren't seen in the last completed poll.
			for (const panelInfo of connectedPanelInfos) {
				const id = PeripheralXkeys.GetXkeysId(panelInfo)
				const alreadySeen = lastSeenXkeysPanels.some((sd) => {
					return PeripheralXkeys.GetXkeysId(sd) === id
				})

				if (alreadySeen) {
					continue
				}

				const found = PeripheralXkeys.FindProduct(panelInfo)

				// Tell the watcher about the discovered Xkeys panel.
				onKnownPeripheral(id, {
					name: found.product.name,
					type: PeripheralType.XKEYS,
					devicePath: panelInfo.path,
				})
			}

			// Tell the watcher about disconnected Xkeys panels.
			for (const id of disconnectedXkeysPanelIds) {
				onKnownPeripheral(id, null)
			}

			// Update for the next iteration.
			lastSeenXkeysPanels = connectedPanelInfos
		}, 1000)

		return {
			stop: () => {
				clearInterval(interval)
				PeripheralXkeys.Watching = false
			},
		}
	}

	/**
	 *  Used to get the human-readable name of the panel without actually connecting to it.
	 *	Copied from xkeys/packages/core/src/xkeys.ts
	 *	https://github.com/SuperFlyTV/xkeys/blob/615db0c740d1a19b33217c94c1c280066cb9688c/packages/core/src/xkeys.ts#L53-L73
	 */
	private static FindProduct(
		this: void,
		panelInfo: HID_Device
	): { product: Product; productId: number; interface: number } {
		for (const product of Object.values<Product>(PRODUCTS)) {
			for (const hidDevice of product.hidDevices) {
				if (
					hidDevice[0] === panelInfo.productId &&
					(panelInfo.interface === null || hidDevice[1] === panelInfo.interface)
				) {
					return {
						product,
						productId: hidDevice[0],
						interface: hidDevice[1],
					} // Return & break out of the loops
				}
			}
		}
		// else:
		throw new Error(
			`Unknown/Unsupported X-keys: "${panelInfo.product}" (productId: "${panelInfo.productId}", interface: "${panelInfo.interface}").\nPlease report this as an issue on our github page!`
		)
	}

	private static GetXkeysId(this: void, panelInfo: HID_Device): PeripheralId {
		return protectString(
			panelInfo.serialNumber ? `xkeys-serial_${panelInfo.serialNumber}` : `xkeys-path_${panelInfo.path}`
		)
	}

	private _info: PeripheralInfo | undefined
	private sentKeyDisplay: { [identifier: string]: KeyDisplay } = {}
	private sentFrequency = 0
	private sentBacklight: {
		[identifier: string]: {
			color: string
			flashing: boolean
		}
	} = {}
	private ignoreKeys = new Set<number>()
	private xkeysPanel?: XKeys

	constructor(log: LoggerLike, id: PeripheralId, private path: string) {
		super(log, id)
	}

	async init(): Promise<void> {
		try {
			this.initializing = true

			this.xkeysPanel = await setupXkeysPanel(this.path)

			this._info = {
				name: this.xkeysPanel.info.name,
				gui: {
					type: PeripheralType.XKEYS,
					colCount: this.xkeysPanel.info.colCount,
					rowCount: this.xkeysPanel.info.rowCount,
					layout: this.xkeysPanel.info.layout,
				},
			}

			// Buttons:
			this.xkeysPanel.on('down', (keyIndex) => {
				if (!this.ignoreKeys.has(keyIndex)) this.emit('keyDown', this.getIdentifier(keyIndex, 'key'))
			})
			this.xkeysPanel.on('up', (keyIndex) => {
				if (!this.ignoreKeys.has(keyIndex)) this.emit('keyUp', this.getIdentifier(keyIndex, 'key'))
			})
			// Analog values:
			this.xkeysPanel.on('jog', (keyIndex, deltaValue) => {
				if (this.ignoreKeys.has(keyIndex)) return
				const identifier = this.getIdentifier(keyIndex, 'jog')
				this.emit('analog', identifier, {
					absolute: this.getAbsoluteValue(identifier, deltaValue),
					relative: deltaValue,
					rAbs: false,
				})
			})
			this.xkeysPanel.on('shuttle', (keyIndex, value) => {
				if (this.ignoreKeys.has(keyIndex)) return
				const identifier = this.getIdentifier(keyIndex, 'shuttle')
				this.emit('analog', identifier, {
					absolute: value,
					relative: this.getRelativeValue(identifier, value),
					rAbs: true,
				})
			})
			this.xkeysPanel.on('tbar', (keyIndex, value) => {
				if (this.ignoreKeys.has(keyIndex)) return
				const identifier = this.getIdentifier(keyIndex, 'tbar')
				this.emit('analog', identifier, {
					absolute: value,
					relative: this.getRelativeValue(identifier, value),
					rAbs: true,
				})
			})
			this.xkeysPanel.on('joystick', (keyIndex, value) => {
				if (this.ignoreKeys.has(keyIndex)) return

				const identifierX = this.getIdentifier(keyIndex, 'joystick-x')
				const identifierY = this.getIdentifier(keyIndex, 'joystick-y')
				const identifierZ = this.getIdentifier(keyIndex, 'joystick-z')
				this.emit('analog', identifierX, {
					absolute: value.x,
					relative: this.getRelativeValue(identifierX, value.x),
					rAbs: true,
				})
				this.emit('analog', identifierY, {
					absolute: value.y,
					relative: this.getRelativeValue(identifierY, value.y),
					rAbs: true,
				})
				this.emit('analog', identifierZ, {
					absolute: value.z,
					relative: value.deltaZ,
					rAbs: false,
				})
			})

			// Connection status:
			this.xkeysPanel.on('disconnected', () => {
				this.emit('disconnected')
			})
			this.xkeysPanel.on('reconnected', () => {
				this.emit('connected')
			})

			this.xkeysPanel.on('error', this.log.error)

			this.xkeysPanel.setAllBacklights(null)
			this.xkeysPanel.setIndicatorLED(1, false) // green
			this.xkeysPanel.setIndicatorLED(2, false) // red

			// Some panels have "keys" permanently set, like when the "key" is actually a "power-on status".
			// Solve this by filtering any keys that are pressed on startup:
			const buttons = this.xkeysPanel.getButtons()
			this.ignoreKeys.clear()
			buttons.forEach((value, keyIndex) => {
				if (value) this.ignoreKeys.add(keyIndex)
			})

			this.connected = true
			this.initializing = false
		} catch (e) {
			this.initializing = false
			throw e
		}
		this.emit('initialized')
	}
	get info(): PeripheralInfo {
		if (!this._info) throw new Error('Peripheral not initialized')
		return this._info
	}
	async _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay, force = false): Promise<void> {
		const key = this.getKeyFromIdentifier(identifier)
		const keyIndex = key.keyIndex

		if (key.type !== 'key') return // Only support keys for now

		if (!keyDisplay) keyDisplay = { attentionLevel: AttentionLevel.IGNORE }

		if (!this.xkeysPanel) return
		if (force || !isEqual(this.sentKeyDisplay[identifier], keyDisplay)) {
			this.sentKeyDisplay[identifier] = keyDisplay

			let { color, flashFrequency } = { color: 'black', flashFrequency: 0 }

			if (this.connectedToParent) {
				if (keyDisplay.intercept) {
					// Normal functionality is intercepted / disabled

					if (keyDisplay.area) {
						if (keyDisplay.area.areaInDefinition) {
							color = 'red'
							flashFrequency = FLASH_FAST
						} else {
							color = 'blue'
						}
					} else {
						color = 'black'
					}
				} else {
					const o = this.getKeyColorAndFlash(keyDisplay)
					color = o.color
					flashFrequency = o.flashFrequency
				}
			}

			// Because the xkeys-panel only has a single flashing-bus, we'll go through
			// all the keys and pick the one with the highest flashing-level.
			const fastestFlashFrequency = Object.values<KeyDisplay>(this.sentKeyDisplay).reduce((prev, keyDisplay) => {
				const { flashFrequency: flash } = this.getKeyColorAndFlash(keyDisplay)
				return Math.max(flash, prev)
			}, 0)

			let notifyAll = false
			if (!force) {
				if (fastestFlashFrequency !== this.sentFrequency) {
					this.sentFrequency = fastestFlashFrequency
					if (fastestFlashFrequency) {
						this.xkeysPanel.setFrequency(fastestFlashFrequency)
					}
					notifyAll = true
				}
			}

			// Only flash this key, if its frequency mathces the one on the flashing-bus:
			const flashing = flashFrequency > 0 && flashFrequency === fastestFlashFrequency

			const backlight = {
				color,
				flashing,
			}
			if (!isEqual(backlight, this.sentBacklight[identifier])) {
				this.sentBacklight[identifier] = backlight
				this.xkeysPanel.setBacklight(keyIndex, color, flashing)

				if (notifyAll) {
					await this._updateAllKeys()
				}
			}
		}
	}
	private getKeyColorAndFlash(keyDisplay: KeyDisplay): { color: string; flashFrequency: number } {
		let color = 'black'
		let flashFrequency = 0
		if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
			color = 'blue'
			flashFrequency = 0
		} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
			color = 'red'
			flashFrequency = 0
		} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
			color = 'red' // flashing slowly
			flashFrequency = FLASH_NORMAL
		} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
			color = 'white' // flashing quickly
			flashFrequency = FLASH_FAST
		}

		return {
			color,
			flashFrequency,
		}
	}
	async setConnectedToParent(connected: boolean): Promise<void> {
		this.connectedToParent = connected
		await this._updateAllKeys()
		if (connected) {
			setTimeout(() => {
				this.emitAllKeys()
			}, 1)
		}
	}
	async close(): Promise<void> {
		if (this.xkeysPanel) {
			this.xkeysPanel.setAllBacklights(null) // set all backlights to black

			this.xkeysPanel.setIndicatorLED(1, false) // green
			this.xkeysPanel.setIndicatorLED(2, true) // red
		}
		await super._close()
		if (this.xkeysPanel) {
			await this.xkeysPanel.close()
		}
	}
	private async _updateAllKeys(): Promise<void> {
		if (this.connectedToParent) {
			this.xkeysPanel?.setIndicatorLED(1, true) // green
			this.xkeysPanel?.setIndicatorLED(2, false) // red
		} else {
			this.xkeysPanel?.setIndicatorLED(1, false) // green
			this.xkeysPanel?.setIndicatorLED(2, true) // red
		}

		for (const [identifier, keyDisplay] of Object.entries<KeyDisplay>(this.sentKeyDisplay)) {
			await this._setKeyDisplay(identifier, keyDisplay, true)
		}
	}
	private emitAllKeys() {
		if (!this.xkeysPanel) return

		const buttons = this.xkeysPanel.getButtons()

		for (const [keyIndex, value] of Array.from(buttons.entries())) {
			if (this.ignoreKeys.has(keyIndex)) continue
			this.emit(value ? 'keyDown' : 'keyUp', `${keyIndex}`)
		}
	}
	private getIdentifier(keyIndex: number, type: KeyType): string {
		// Handle these a bit special, to be backwards compatible:
		if (type === 'key') return `${keyIndex}`
		else if (type === 'joystick-x') return `joystick-${keyIndex}-x`
		else if (type === 'joystick-y') return `joystick-${keyIndex}-y`
		else if (type === 'joystick-z') return `joystick-${keyIndex}-z`
		else if (type === 'jog') return `jog-${keyIndex}`
		else if (type === 'shuttle') return `shuttle-${keyIndex}`
		else if (type === 'tbar') return `tbar-${keyIndex}`
		else assertNever(type)
		return `${type}-${keyIndex}`
	}
	private getKeyFromIdentifier(identifier: string): {
		keyIndex: number
		type: KeyType
	} {
		{
			const m = identifier.match(/^\d+$/)
			if (m) return { keyIndex: parseInt(identifier, 10), type: 'key' }
		}
		{
			const m = identifier.match(/^joystick-(\d+)-x$/)
			if (m) return { keyIndex: parseInt(m[1], 10), type: 'joystick-x' }
		}
		{
			const m = identifier.match(/^joystick-(\d+)-y$/)
			if (m) return { keyIndex: parseInt(m[1], 10), type: 'joystick-y' }
		}
		{
			const m = identifier.match(/^joystick-(\d+)-z$/)
			if (m) return { keyIndex: parseInt(m[1], 10), type: 'joystick-z' }
		}
		{
			const m = identifier.match(/^(\w+)-(\d+)$/)
			if (m) return { keyIndex: parseInt(m[2], 10), type: m[1] as KeyType }
		}
		throw new Error(`Xkeys: Unknown identifier: "${identifier}"`)
	}
}
type KeyType = 'key' | 'jog' | 'shuttle' | 'tbar' | 'joystick-x' | 'joystick-y' | 'joystick-z'
