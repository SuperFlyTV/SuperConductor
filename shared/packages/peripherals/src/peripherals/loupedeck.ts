import _ from 'lodash'
import sharp from 'sharp'
import { AttentionLevel, KeyDisplay, LoggerLike, PeripheralInfo, PeripheralType } from '@shared/api'
import { stringToRGB, RGBToString, stringifyError, assertNever } from '@shared/lib'
import {
	listLoupedecks,
	LoupedeckControlType,
	LoupedeckDevice,
	LoupedeckDeviceInfo,
	LoupedeckModelId,
	LoupedeckTouchEventData,
	LoupedeckTouchObject,
	openLoupedeck,
	LoupedeckControlInfo,
	LoupedeckDisplayId,
	LoupedeckBufferFormat,
} from '@loupedeck/node'
import { onKnownPeripheralCallback, Peripheral, WatchReturnType } from './peripheral'
import { estimateTextWidth, limitTextWidth } from './lib/estimateTextSize'
import PQueue from 'p-queue'

export class PeripheralLoupedeck extends Peripheral {
	private static Watching = false
	static Watch(this: void, onKnownPeripheral: onKnownPeripheralCallback): WatchReturnType {
		if (PeripheralLoupedeck.Watching) {
			throw new Error('Already watching')
		}

		PeripheralLoupedeck.Watching = true

		let lastSeenLoupedecks: LoupedeckDeviceInfo[] = []

		// Check for new or removed Loupe Deck every second.
		const interval = setInterval(() => {
			Promise.resolve()
				.then(async () => {
					// List the connected Loupedecks.
					const loupedecks = await listLoupedecks()

					// If the list has not changed since the last poll, do nothing.
					if (_.isEqual(loupedecks, lastSeenLoupedecks)) {
						return
					}

					// Figure out which Loupe Decks have been unplugged since the last check.
					const disconnectedLoupedeckIds = new Set(
						lastSeenLoupedecks.map(PeripheralLoupedeck.GetLoupedeckId).filter((id) => {
							return !loupedecks.some((sd) => PeripheralLoupedeck.GetLoupedeckId(sd) === id)
						})
					)

					// Figure out which Loupedeck are being seen now that weren't seen in the last completed poll.
					for (const loupedeck of loupedecks) {
						const id = PeripheralLoupedeck.GetLoupedeckId(loupedeck)
						const alreadySeen = lastSeenLoupedecks.some((ld) => {
							return PeripheralLoupedeck.GetLoupedeckId(ld) === id
						})

						if (alreadySeen) continue

						// Tell the watcher about the discovered Loupedeck
						onKnownPeripheral(id, {
							name: PeripheralLoupedeck.GetLoupedeckName(loupedeck),
							type: PeripheralType.LOUPEDECK,
							devicePath: loupedeck.path,
						})
					}

					// Tell the watcher about disconnected Loupedecks.
					for (const id of disconnectedLoupedeckIds) {
						onKnownPeripheral(id, null)
					}

					// Update for the next iteration.
					lastSeenLoupedecks = loupedecks
				})
				.catch(console.error)
		}, 1000)

		return {
			stop: () => {
				clearInterval(interval)
				PeripheralLoupedeck.Watching = false
			},
		}
	}

	private static GetLoupedeckId(this: void, loupedeck: LoupedeckDeviceInfo): string {
		return loupedeck.serialNumber
			? `loupedeck-serial_${loupedeck.model}_${loupedeck.serialNumber}`
			: `loupedeck-path_${loupedeck.model}_${loupedeck.path}`
	}

	private static GetLoupedeckName(loupedeck: LoupedeckDeviceInfo | LoupedeckDevice): string {
		const model: LoupedeckModelId = 'model' in loupedeck ? loupedeck.model : loupedeck.modelId

		switch (model) {
			case LoupedeckModelId.LoupedeckLive:
				return 'Loupedeck Live'
			case LoupedeckModelId.LoupedeckLiveS:
				return 'Loupedeck Live S'
			case LoupedeckModelId.RazerStreamController:
				return 'Razer Stream Controller'

			default:
				assertNever(model)
				return 'Loupe Deck'
		}
	}
	private static GetLoupedeckLayout(
		loupedeck: LoupedeckDeviceInfo | LoupedeckDevice
	): 'live' | 'live-s' | 'razer' | 'other' {
		const model: LoupedeckModelId = 'model' in loupedeck ? loupedeck.model : loupedeck.modelId

		switch (model) {
			case LoupedeckModelId.LoupedeckLive:
				return 'live'

			case LoupedeckModelId.LoupedeckLiveS:
				return 'live-s'

			case LoupedeckModelId.RazerStreamController:
				return 'razer'

			default:
				assertNever(model)
				return 'other'
		}
	}

	private loupedeck?: LoupedeckDevice
	private _info: PeripheralInfo | undefined
	private receivedKeyDisplay: { [identifier: string]: KeyDisplay } = {}
	private displayKeyDisplay: { [identifier: string]: KeyDisplay } = {}
	private connectedToParent = false
	private queue = new PQueue({ concurrency: 1 })
	private keys: { [identifier: string]: boolean } = {}
	private encoders: { [identifier: string]: number } = {}
	private touches: { [identifier: string]: LoupedeckTouchObject } = {}
	private activeTouch: number | undefined = undefined

	private hasEmittedAllKeysOnPage = new Set<number>()

	private virtualPage = 0

	constructor(log: LoggerLike, id: string, private path: string) {
		super(log, id)
	}

	async init(): Promise<void> {
		try {
			this.initializing = true

			this.loupedeck = await openLoupedeck(this.path)

			const name = PeripheralLoupedeck.GetLoupedeckName(this.loupedeck)

			this._info = {
				name: name,
				gui: {
					type: PeripheralType.LOUPEDECK,
					layout: PeripheralLoupedeck.GetLoupedeckLayout(this.loupedeck),
					lcdKeyColumns: this.loupedeck.lcdKeyColumns,
					lcdKeyRows: this.loupedeck.lcdKeyRows,
				},
			}

			this.connected = true

			// Press / Release of the buttons:
			this.loupedeck.on('down', (info) => {
				const identifier = this.controlInfoToIdentifier(info, 'button')
				this.keys[identifier] = true
				this.emit('keyDown', identifier)
			})

			this.loupedeck.on('up', (info) => {
				const identifier = this.controlInfoToIdentifier(info, 'button')
				this.keys[identifier] = false
				this.emit('keyUp', identifier)
			})

			// Rotate the knobs:
			this.loupedeck.on('rotate', (info, deltaValue) => {
				const identifier = this.controlInfoToIdentifier(info, 'rotate')
				this.encoders[identifier] = deltaValue
				this.emit('analog', identifier, {
					absolute: this.getAbsoluteValue(identifier, deltaValue),
					relative: deltaValue,
					rAbs: false,
				})
			})
			const handleTouches = (
				touchInfo: LoupedeckTouchEventData,
				eventType: 'touchend' | 'touchmove' | 'touchstart'
			) => {
				for (const touch of touchInfo.changedTouches) {
					if (eventType === 'touchstart') {
						this.activeTouch = touch.id
					}

					const identifier = this.touchInfoToIdentifier(touch.target)

					if (
						touch.target.screen === LoupedeckDisplayId.Left ||
						touch.target.screen === LoupedeckDisplayId.Right
					) {
						this.emit('analog', identifier, {
							absolute: touch.y,
							relative: this.getRelativeValue(identifier, touch.y),
							rAbs: true,
						})
					} else if (touch.target.screen === LoupedeckDisplayId.Center) {
						// Handle when touching on keys:
						if (touch.target.key !== undefined) {
							if (eventType === 'touchstart') {
								this.keys[identifier] = true
								this.emit('keyDown', identifier)
							} else if (eventType === 'touchend') {
								this.keys[identifier] = false
								this.emit('keyUp', identifier)
							}
						}
					} else {
						assertNever(touch.target.screen)
					}

					if (touch.id === this.activeTouch) {
						const touchIdentifierX = 'touch-lcd-0-x'
						const touchIdentifierY = 'touch-lcd-0-y'

						// Since we get the x and y position of the touch, they can be emitted as analog values:
						this.emit('analog', touchIdentifierX, {
							absolute: touch.x,
							relative: this.getRelativeValue(touchIdentifierX, touch.x),
							rAbs: true,
						})
						this.emit('analog', touchIdentifierY, {
							absolute: touch.y,
							relative: this.getRelativeValue(touchIdentifierY, touch.y),
							rAbs: true,
						})
					}
				}
			}
			this.loupedeck.on('touchend', (touchInfo) => {
				handleTouches(touchInfo, 'touchend')
			})
			this.loupedeck.on('touchmove', (touchInfo) => {
				handleTouches(touchInfo, 'touchmove')
			})
			this.loupedeck.on('touchstart', (touchInfo) => {
				handleTouches(touchInfo, 'touchstart')
			})

			this.loupedeck.on('error', (error) => {
				this.log.error('Loupedeck error: ' + stringifyError(error))
			})
			await sleep(10) // to avoid an common initial "unable to write to HID device" error.
			await this._updateAllKeys('Initializing')

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
	async _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay): Promise<void> {
		this.receivedKeyDisplay[identifier] = keyDisplay
		return this._setKeyDisplayInternal(identifier, keyDisplay)
	}
	private async _setKeyDisplayInternal(identifier: string, keyDisplay: KeyDisplay, force = false): Promise<void> {
		if (!this.loupedeck) return

		const info = this.identifierToControlInfo(identifier)
		if (!info) return

		if (!keyDisplay) {
			if (info.type === 'button') {
				keyDisplay = { attentionLevel: AttentionLevel.IGNORE }
			} else if (info.type === 'rotate') {
				keyDisplay = { attentionLevel: AttentionLevel.IGNORE }
			} else if (info.type === 'touch') {
				keyDisplay = { attentionLevel: AttentionLevel.IGNORE }
			} else {
				assertNever(info.type)
				keyDisplay = { attentionLevel: AttentionLevel.IGNORE }
			}
		}

		const oldKeyDisplay = this.displayKeyDisplay[identifier] as KeyDisplay | undefined
		if (force || !_.isEqual(oldKeyDisplay, keyDisplay)) {
			this.displayKeyDisplay[identifier] = keyDisplay

			if (!this.connectedToParent) {
				// Intercept:

				const info = this.identifierToControlInfo(identifier)

				if (info && info.type === 'touch' && info.index === 0) {
					keyDisplay = {
						attentionLevel: AttentionLevel.INFO,
						header: {
							long: 'Disconnected',
						},
					}
				} else {
					keyDisplay = {
						attentionLevel: AttentionLevel.IGNORE,
					}
				}
			}

			await this.drawKeyDisplay(this.loupedeck, this.queue, info, keyDisplay)

			if (oldKeyDisplay?.area?.areaId !== keyDisplay.area?.areaId) {
				const adjacentButtons = this.getAdjacentKeys(info)

				for (const keyIndex of Object.values(adjacentButtons)) {
					if (keyIndex !== null) {
						const identifier = this.controlInfoToIdentifier(keyIndex, 'button')
						await this._setKeyDisplayInternal(identifier, this.displayKeyDisplay[identifier], true)
					}
				}
			}
		}
	}
	async _updateAllKeys(specialMessage?: string): Promise<void> {
		if (!this.loupedeck) return

		if (!this.connectedToParent || specialMessage) {
			// We might as well clear everything a little early:
			await this.queue.add(async () => {
				await this.loupedeck?.blankDevice(true, true)
			})
		}
		// Buttons
		for (const control of this.loupedeck.controls) {
			let type: 'button' | 'rotate'
			if (control.type === LoupedeckControlType.Button) {
				type = 'button'
			} else if (control.type === LoupedeckControlType.Rotary) {
				type = 'rotate'
			} else {
				assertNever(control.type)
				continue
			}

			const identifier = this.controlInfoToIdentifier(control, type)
			let keyDisplay = this.receivedKeyDisplay[identifier]

			if (control.index === 0 && !this.connectedToParent) {
				keyDisplay = {
					attentionLevel: AttentionLevel.NEUTRAL,
					header: {
						long: 'Disconnected',
					},
				}
			}
			if (control.index === 0 && specialMessage) {
				keyDisplay = {
					attentionLevel: AttentionLevel.NEUTRAL,
					header: {
						long: specialMessage,
					},
				}
			}
			await this._setKeyDisplayInternal(identifier, keyDisplay, true)
		}

		// Touch keys
		const keyCount = this.loupedeck.lcdKeyColumns * this.loupedeck.lcdKeyRows
		for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
			const identifier = this.touchInfoToIdentifier({
				key: keyIndex,
				screen: LoupedeckDisplayId.Center,
			})
			let keyDisplay = this.receivedKeyDisplay[identifier]

			if (keyIndex === 0 && !this.connectedToParent) {
				keyDisplay = {
					attentionLevel: AttentionLevel.NEUTRAL,
					header: {
						long: 'Disconnected',
					},
				}
			}
			if (keyIndex === 0 && specialMessage) {
				keyDisplay = {
					attentionLevel: AttentionLevel.NEUTRAL,
					header: {
						long: specialMessage,
					},
				}
			}
			await this._setKeyDisplayInternal(identifier, keyDisplay, true)
		}
		// Knobs?
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
		if (this.loupedeck) {
			this.connectedToParent = false
			await this._updateAllKeys('Closed')
		}
		await super._close()
		if (this.loupedeck) {
			await this.loupedeck.close()
		}
		this.connected = false
		this.emit('disconnected')
		this.loupedeck = undefined
	}

	private emitAllKeys() {
		if (!this.loupedeck) return

		this.hasEmittedAllKeysOnPage.add(this.virtualPage)
		// Buttons
		for (const control of this.loupedeck.controls) {
			let type: 'button' | 'rotate'
			if (control.type === LoupedeckControlType.Button) {
				type = 'button'
			} else if (control.type === LoupedeckControlType.Rotary) {
				type = 'rotate'
			} else {
				assertNever(control.type)
				continue
			}
			const identifier = this.controlInfoToIdentifier(control, type)
			if (this.keys[identifier]) this.emit('keyDown', identifier)
			else this.emit('keyUp', identifier)
		}
		// Touch keys
		const keyCount = this.loupedeck.lcdKeyColumns * this.loupedeck.lcdKeyRows
		for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) {
			{
				const identifier = this.touchInfoToIdentifier({
					key: keyIndex,
					screen: LoupedeckDisplayId.Center,
				})
				if (this.keys[identifier]) this.emit('keyDown', identifier)
				else this.emit('keyUp', identifier)
				// this.emit('analog', identifier, {
				// 	absolute: this.getAbsoluteValue(identifier, 0),
				// 	relative: 0,
				// 	rAbs: false,
				// })
			}
		}
	}
	private async drawKeyDisplay(
		loupedeck: LoupedeckDevice,
		queue: PQueue,
		key: Key,
		keyDisplay: KeyDisplay,
		darkBG = false
	) {
		let img: sharp.Sharp | null = null
		let svg = ''
		const inputs: sharp.OverlayOptions[] = []

		let SIZE: number
		let SIZE_W: number
		let SIZE_H: number

		if (key.type === 'button') {
			// Buttons have only a color
			SIZE_W = SIZE_H = SIZE = 0
		} else if (key.type === 'rotate') {
			// Not supported right now
			return
		} else if (key.type === 'touch') {
			SIZE_W = SIZE_H = SIZE = loupedeck.lcdKeySize
		} else {
			assertNever(key.type)
			SIZE_W = SIZE_H = SIZE = 72
		}
		const SIZE_AVG = (SIZE_H + SIZE_W) / 2

		// A font size that should look good on most loupedecks (?):
		const defaultFontsize = Math.floor((SIZE_AVG * 20) / 96)
		const padding = 5
		let bgColor = '#000'
		let mainColor = '#000'
		const borders = {
			top: true,
			bottom: true,
			left: true,
			right: true,
		}

		if (keyDisplay.intercept) {
			// Normal functionality is intercepted / disabled

			let textColor = '#fff'

			if (keyDisplay.area) {
				bgColor = keyDisplay.area.color

				if (keyDisplay.area.areaInDefinition) {
					textColor = '#fff'
				} else {
					textColor = '#bbb'
				}
				// Area label:
				svg += `<text
			font-family="Arial, Helvetica, sans-serif"
			font-size="${defaultFontsize}px"
			x="0"
			y="${defaultFontsize}"
			fill="${textColor}"
			text-anchor="start"
			>${keyDisplay.area.areaLabel}</text>`
				// Key label:
				svg += `<text
			font-family="Arial, Helvetica, sans-serif"
			font-size="${Math.floor(SIZE / 2)}px"
			x="${Math.floor(SIZE / 2)}"
			y="${defaultFontsize + Math.floor(SIZE / 2)}"
			fill="${textColor}"
			text-anchor="middle"
			>${keyDisplay.area.keyLabel}</text>`
			} else {
				bgColor = '#000'
			}
		} else {
			const maxTextWidth = SIZE_W - padding

			const dampenText = keyDisplay.attentionLevel === AttentionLevel.IGNORE
			const dampenBackgroundImage = dampenText || keyDisplay.attentionLevel === AttentionLevel.ALERT

			let x = 0
			let y = 0
			const xCenter = Math.floor(SIZE_W / 2)

			x += padding
			y += padding + defaultFontsize

			const svgTextLine = (arg: {
				text: string
				fontSize?: number
				center?: boolean
				textColor?: string
				wrap?: boolean
				maxLines?: number
			}): string => {
				if (!arg.fontSize) arg.fontSize = 1
				let text = arg.text

				if (!text.length) return ''

				if (text.includes('\n')) {
					const lines = text.split('\n')
					let textSVG = ''
					if (arg.maxLines) lines.splice(arg.maxLines, 999)
					for (const line of lines) {
						textSVG += svgTextLine({
							...arg,
							text: line,
						})
					}
					return textSVG
				} else {
					const orgFontSize = Math.floor(defaultFontsize * arg.fontSize)
					let actualFontSize = orgFontSize

					let estTextWidth = estimateTextWidth(text, actualFontSize)
					if (estTextWidth > maxTextWidth) {
						// Shrink the text a bit:
						actualFontSize = Math.floor(actualFontSize * 0.8)
						estTextWidth = estimateTextWidth(text, actualFontSize)
					}

					if (arg.wrap && estTextWidth > maxTextWidth) {
						let orgText = text
						const lines: string[] = []

						while (orgText.length > 0) {
							const line = limitTextWidth(orgText, actualFontSize, maxTextWidth)
							lines.push(line)
							orgText = orgText.slice(line.length)
						}
						if (arg.maxLines) lines.splice(arg.maxLines, 999)
						return svgTextLine({
							...arg,
							wrap: false,
							text: lines.join('\n'),
						})
					} else {
						// Limit the text, if too long:
						text = limitTextWidth(text, actualFontSize, maxTextWidth)

						const textSVG = `<text
									font-family="Arial, Helvetica, sans-serif"
									font-size="${actualFontSize}px"
									x="${arg.center ? xCenter : x}"
									y="${y}"
									fill="${arg.textColor ?? '#FFFFFF'}"
									text-anchor="${arg.center ? 'middle' : 'start'}"
									>${text}</text>`
						y += Math.max(actualFontSize, orgFontSize)
						return textSVG
					}
				}
			}

			// Background:

			let hasBackgroundImage = false
			if (keyDisplay.thumbnail && SIZE_W && SIZE_H) {
				const uri = keyDisplay.thumbnail.split(';base64,').pop()

				if (uri) {
					try {
						const imgBuffer = Buffer.from(uri, 'base64')
						img = sharp(imgBuffer).trim().flatten().resize(SIZE_W, SIZE_H)
						// .modulate({
						// 	brightness: 0.5,
						// })
						// .blur()

						if (dampenBackgroundImage || darkBG) img.modulate({ brightness: 0.5 })

						img.blur()
						hasBackgroundImage = true
					} catch (e) {
						this.log.error('Error when processing thumbnail')
						this.log.error(e)
						img = null
					}
				}
			}
			if (!hasBackgroundImage) {
				if (keyDisplay.area) {
					// Darken the color:
					const rgb = stringToRGB(keyDisplay.area.color)
					bgColor = RGBToString({
						r: rgb.r * 0.5,
						g: rgb.g * 0.5,
						b: rgb.b * 0.5,
					})
				}
			}
			let averageBackgroundColor: { r: number; g: number; b: number } | undefined
			// Calculate background brightness
			if (img) {
				const averagePixel = await img.clone().resize(1, 1).raw().toBuffer()

				averageBackgroundColor = {
					r: Number(averagePixel[0]),
					g: Number(averagePixel[1]),
					b: Number(averagePixel[1]),
				}
			}

			// Border:
			{
				let borderWidth = 0
				let borderColor = '#000'

				if (keyDisplay.attentionLevel === AttentionLevel.IGNORE) {
					borderWidth = 0
					borderColor = '#666'
					mainColor = '#000'
				} else if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
					borderWidth = 3
					borderColor = '#666'
					mainColor = borderColor
				} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
					borderWidth = 3
					borderColor = '#bbb'
					mainColor = borderColor
				} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
					borderColor = '#ff0'
					mainColor = borderColor
					borderWidth = 4
				} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
					borderWidth = 10
					borderColor = '#f00'
					mainColor = borderColor
					if (!hasBackgroundImage) {
						bgColor = '#ff3'
					}
				}

				if (keyDisplay.area) {
					bgColor = keyDisplay.area.color

					if (keyDisplay.attentionLevel <= AttentionLevel.NEUTRAL) {
						borderWidth = 5

						// Remove borders to adjacent buttons with the same area:
						const adjacentKeys = this.getAdjacentKeys(key)
						borders.top = !(
							adjacentKeys.top !== null &&
							this.displayKeyDisplay[this.controlInfoToIdentifier(adjacentKeys.top, 'button')]?.area
								?.areaId === keyDisplay.area.areaId
						)
						borders.bottom = !(
							adjacentKeys.bottom !== null &&
							this.displayKeyDisplay[this.controlInfoToIdentifier(adjacentKeys.bottom, 'button')]?.area
								?.areaId === keyDisplay.area.areaId
						)
						borders.left = !(
							adjacentKeys.left !== null &&
							this.displayKeyDisplay[this.controlInfoToIdentifier(adjacentKeys.left, 'button')]?.area
								?.areaId === keyDisplay.area.areaId
						)
						borders.right = !(
							adjacentKeys.right !== null &&
							this.displayKeyDisplay[this.controlInfoToIdentifier(adjacentKeys.right, 'button')]?.area
								?.areaId === keyDisplay.area.areaId
						)
					}
				}

				if (borderWidth) {
					borderWidth += 3
					if (hasBackgroundImage) borderWidth += 3

					const radius = key.type === 'button' ? 10 : 0

					let x = 0
					let y = 0
					let width = SIZE_W
					let height = SIZE_H

					// It's a hack, but it works..
					// Hide borders by drawing ourside:
					if (!borders.top) {
						y -= radius
						height += radius
					}
					if (!borders.bottom) {
						height += radius
					}
					if (!borders.left) {
						x -= radius
						width += radius
					}
					if (!borders.right) {
						width += radius
					}

					svg += `<rect
						x="${x}"
						y="${y}"
						width="${width}"
						height="${height}"
						rx="${radius}"
						stroke="${borderColor}"
						stroke-width="${borderWidth}"
						fill="none"
					/>`
				}
			}
			// Calculate background brightness:
			if (!averageBackgroundColor) averageBackgroundColor = stringToRGB(bgColor)
			/** 0 - 255 */
			const brightness =
				(averageBackgroundColor.r * 299 + averageBackgroundColor.g * 587 + averageBackgroundColor.b * 114) /
				1000
			const backgroundIsDark = brightness < 127

			// Determine text color:
			let textColor: string
			if (backgroundIsDark) {
				textColor = dampenText ? '#999' : '#fff'
			} else {
				textColor = dampenText ? '#333' : '#000'
			}

			if (keyDisplay.header) {
				svg += svgTextLine({
					text: keyDisplay.header.short || keyDisplay.header.long,
					fontSize: 1.1,
					textColor,
					// center: key.type === 'encoder',
					wrap: true,
					maxLines: 2,
				})
			}
			if (keyDisplay.info) {
				svg += svgTextLine({
					text: keyDisplay.info.short || keyDisplay.info.long,
					fontSize: 0.8,
					textColor,
					// center: key.type === 'encoder',
					wrap: true,
					maxLines: 3,
				})

				if (keyDisplay.info.analogValue) {
					svg += svgTextLine({
						text: keyDisplay.info.analogValue,
						textColor,
						center: true,
					})
				}
			}
		}

		if (svg && SIZE_H && SIZE_W) {
			inputs.push({
				input: Buffer.from(
					`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE_W} ${SIZE_H}" version="1.1">${svg}</svg>`
				),
				top: 0,
				left: 0,
			})
		}

		let keyGotAnyContent = false

		if (!img && SIZE_W && SIZE_H) {
			img = sharp({
				create: {
					width: SIZE_W,
					height: SIZE_H,
					channels: 3,
					background: bgColor,
				},
			}).ensureAlpha()
		} else {
			keyGotAnyContent = true
		}

		if (img && inputs.length) {
			keyGotAnyContent = true
			img = img.composite(inputs)
		}

		try {
			const img2: sharp.Sharp | null = img

			await queue.add(async () => {
				// Do an additional check if we're still connected to the device:
				if (!this.connected) return

				// Remporary hack fix:
				// There is an strange, unsolved bug where sharp .toBuffer() doesn't resolve,
				// but only when two streamdecks are connected.
				// Adding a temporary timeout for now to lessen the impact of this bug.
				const tmpImg: Buffer | null = img2
					? await Promise.race([
							img2.raw().toBuffer(),
							new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
					  ])
					: null

				// Do an additional check if we're still connected to the device:
				if (!this.connected) return

				if (key.type === 'button') {
					const RGB = stringToRGB(mainColor)
					await loupedeck.setButtonColor({ id: key.index, red: RGB.r, blue: RGB.b, green: RGB.g })
				} else if (key.type === 'rotate') {
				} else if (key.type === 'touch') {
					if (keyGotAnyContent && tmpImg) {
						await loupedeck.drawKeyBuffer(key.index, tmpImg, LoupedeckBufferFormat.RGB)
					} else {
						const bgRGB = stringToRGB(bgColor)
						await loupedeck.drawKeySolidColour(key.index, {
							red: bgRGB.r,
							green: bgRGB.g,
							blue: bgRGB.b,
						})
					}
				} else {
					assertNever(key.type)
				}
			})
		} catch (e) {
			this.log.error(keyDisplay)
			throw e
		}
	}
	private getAdjacentKeys(key: Key): {
		top: LoupedeckControlInfo | null
		bottom: LoupedeckControlInfo | null
		left: LoupedeckControlInfo | null
		right: LoupedeckControlInfo | null
	} {
		if (!this.loupedeck) throw new Error('No loupedeck connected')

		if (key.type === 'button') {
			const center = this.keyIndexToRowColumn(key.index)

			const rowcolumns = {
				top: { row: center.row - 1, column: center.column }, // Above
				bottom: { row: center.row + 1, column: center.column }, // Below
				left: { row: center.row, column: center.column - 1 }, // Left
				right: { row: center.row, column: center.column + 1 }, // Right
			}

			return {
				top:
					rowcolumns.top.row >= 0
						? { type: LoupedeckControlType.Button, index: this.rowColumnToKeyIndex(rowcolumns.top) }
						: null,
				bottom:
					rowcolumns.bottom.row < this.loupedeck.lcdKeyRows
						? { type: LoupedeckControlType.Button, index: this.rowColumnToKeyIndex(rowcolumns.bottom) }
						: null,
				left:
					rowcolumns.left.column >= 0
						? { type: LoupedeckControlType.Button, index: this.rowColumnToKeyIndex(rowcolumns.left) }
						: null,
				right:
					rowcolumns.right.column < this.loupedeck.lcdKeyColumns
						? { type: LoupedeckControlType.Button, index: this.rowColumnToKeyIndex(rowcolumns.right) }
						: null,
			}
		} else {
			return {
				top: null,
				bottom: null,
				left: null,
				right: null,
			}
		}
	}
	private keyIndexToRowColumn(keyIndex: number): { row: number; column: number } {
		if (!this.loupedeck) throw new Error('No loupedeck connected')

		const columns = this.loupedeck.lcdKeyColumns

		const row = Math.floor(keyIndex / columns)
		const column = keyIndex % columns
		return { row, column }
	}
	private rowColumnToKeyIndex(rowColumn: { row: number; column: number }): number {
		if (!this.loupedeck) throw new Error('No loupedeck connected')
		const columns = this.loupedeck.lcdKeyColumns
		return rowColumn.row * columns + rowColumn.column
	}

	private identifierToControlInfo(identifier: string): Key | undefined {
		let index: number | undefined = undefined
		let type: KeyType | undefined = undefined
		{
			const m = identifier.match(/^button-(\d+)$/)
			if (m) {
				type = 'button'
				index = parseInt(m[1], 10)
			}
		}
		{
			const m = identifier.match(/^rotate-(\d+)$/)
			if (m) {
				type = 'rotate'
				index = parseInt(m[1], 10)
			}
		}
		{
			const m = identifier.match(/^touch-(\w+)$/)
			if (m) {
				type = 'touch'
				index = parseInt(m[1], 10)
			}
		}
		{
			const m = identifier.match(/^(\w+)-(\d+)$/)
			if (m) {
				type = m[1] as KeyType
				index = parseInt(m[2], 10)
			}
		}

		if (index === undefined) return undefined
		if (!type) return undefined

		// const keyIndex = this.getRealKeyIndex(virtualKeyIndex, type)
		// if (keyIndex === undefined) return undefined

		return { index, type }
	}

	private controlInfoToIdentifier(info: LoupedeckControlInfo, type: 'button' | 'rotate'): string {
		// const vKeyIndex = this.getVirtualKeyIndex(keyIndex, type)
		if (type === 'button') {
			return `button-${info.type}-${info.index}`
		} else if (type === 'rotate') {
			return `rotate-${info.type}-${info.index}`
		} else {
			assertNever(type)
			return `${type}-${info.index}`
		}
	}
	private touchInfoToIdentifier(infoTarget: { screen: LoupedeckDisplayId; key: number | undefined }): string {
		if (infoTarget.key !== undefined) {
			return `touch-${infoTarget.screen}-${infoTarget.key}`
		} else {
			return `touch-${infoTarget.screen}`
		}
	}
}

type Key = {
	index: number
	type: KeyType
}
type KeyType = 'button' | 'rotate' | 'touch'
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
