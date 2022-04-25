import { AttentionLevel, KeyDisplay, PeripheralInfo } from '@shared/api'
import _ from 'lodash'
import { XKeysWatcher, XKeys } from 'xkeys'
import { Peripheral } from './peripheral'
// eslint-disable-next-line node/no-extraneous-import
import { Logger } from 'winston'

/** An X-keys value for how fast the keys should flash, when flashing Fast */
const FLASH_FAST = 7
/** An X-keys value for how fast the keys should flash, when flashing Slowly */
const FLASH_NORMAL = 30

export class PeripheralXkeys extends Peripheral {
	private connectedToParent = false
	static Watch(log: Logger, onDevice: (peripheral: PeripheralXkeys) => void) {
		let usePolling = false
		// Check if usb-detection is installed:
		try {
			// eslint-disable-next-line node/no-missing-require, node/no-extraneous-require
			require.resolve('usb-detection') // require.resolve() throws an error if module is not found
		} catch (e) {
			// usb-detection is not installed, fall back to polling:
			usePolling = true
		}

		const watcher = new XKeysWatcher({
			automaticUnitIdMode: true,
			usePolling,
			// pollingInterval: 1000,
		})

		watcher.on('connected', (xkeysPanel) => {
			const id = `xkeys-${xkeysPanel.uniqueId}`

			const newDevice = new PeripheralXkeys(log, id, xkeysPanel)

			newDevice
				.init()
				.then(() => onDevice(newDevice))
				.catch(log.error)
		})

		return {
			stop: () => watcher.stop().catch(log.error),
		}
	}

	public initializing = false
	public connected = false
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

	constructor(log: Logger, id: string, private xkeysPanel: XKeys) {
		super(log, id)
	}

	async init(): Promise<void> {
		try {
			this.initializing = true

			this._info = {
				name: this.xkeysPanel.info.name,
				gui: {
					type: 'xkeys',
					colCount: this.xkeysPanel.info.colCount,
					rowCount: this.xkeysPanel.info.rowCount,
					layout: this.xkeysPanel.info.layout,
				},
			}

			this.xkeysPanel.on('down', (keyIndex) => {
				if (!this.ignoreKeys.has(keyIndex)) this.emit('keyDown', `${keyIndex}`)
			})
			this.xkeysPanel.on('up', (keyIndex) => {
				if (!this.ignoreKeys.has(keyIndex)) this.emit('keyUp', `${keyIndex}`)
			})

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

			this.initializing = false
		} catch (e) {
			this.initializing = false
			throw e
		}
	}
	get info(): PeripheralInfo {
		if (!this._info) throw new Error('Peripheral not initialized')
		return this._info
	}
	async _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay, force = false): Promise<void> {
		const keyIndex = parseInt(identifier)
		if (!keyDisplay) keyDisplay = { attentionLevel: AttentionLevel.IGNORE }

		if (!this.xkeysPanel) return
		if (force || !_.isEqual(this.sentKeyDisplay[identifier], keyDisplay)) {
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
			const fastestFlashFrequency = Object.values(this.sentKeyDisplay).reduce((prev, keyDisplay) => {
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
			if (!_.isEqual(backlight, this.sentBacklight[identifier])) {
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
	async close() {
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
			this.xkeysPanel.setIndicatorLED(1, true) // green
			this.xkeysPanel.setIndicatorLED(2, false) // red
		} else {
			this.xkeysPanel.setIndicatorLED(1, false) // green
			this.xkeysPanel.setIndicatorLED(2, true) // red
		}

		for (const [identifier, keyDisplay] of Object.entries(this.sentKeyDisplay)) {
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
}
