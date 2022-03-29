import _ from 'lodash'
import sharp from 'sharp'
import { AttentionLevel, KeyDisplay } from '@shared/api'
import { openStreamDeck, listStreamDecks, StreamDeck, DeviceModelId } from '@elgato-stream-deck/node'
import { Peripheral } from './peripheral'
import PQueue from 'p-queue'

export class PeripheralStreamDeck extends Peripheral {
	static Watch(onDevice: (peripheral: PeripheralStreamDeck) => void) {
		const seenDevices = new Map<string, PeripheralStreamDeck>()

		const interval = setInterval(() => {
			const streamDecks = listStreamDecks()

			for (const streamDeck of streamDecks) {
				// Create a locally unique identifier for the device:

				const id = streamDeck.serialNumber ? `serial_${streamDeck.serialNumber}` : `path_${streamDeck.path}`

				const existingDevice = seenDevices.get(id)
				if (!existingDevice) {
					const newDevice = new PeripheralStreamDeck(id, streamDeck.path)

					seenDevices.set(id, newDevice)

					newDevice
						.init()
						.then(() => onDevice(newDevice))
						.catch(console.error)
				} else {
					if (existingDevice && !existingDevice.connected && !existingDevice.initializing) {
						existingDevice
							.init()
							.then(() => {
								existingDevice.emit('connected')
							})
							.catch(console.error)
					}
				}
			}
		}, 1000)

		return {
			stop: () => clearInterval(interval),
		}
	}

	public initializing = false
	public connected = false
	private streamDeck?: StreamDeck
	private sentKeyDisplay: { [identifier: string]: KeyDisplay } = {}
	private connectedToParent = false
	private queue = new PQueue({ concurrency: 1 })
	private keys: { [identifier: string]: boolean } = {}
	constructor(id: string, private path: string) {
		super(id)
	}

	async init(): Promise<void> {
		try {
			this.initializing = true

			this.streamDeck = openStreamDeck(this.path)

			let name = 'Stream Deck'
			if (this.streamDeck.MODEL === DeviceModelId.MINI) name += ' Mini'
			else if (this.streamDeck.MODEL === DeviceModelId.XL) name += ' XL'
			this._name = name

			this.connected = true

			this.streamDeck.on('down', (keyIndex) => {
				const identifier = keyIndexToIdentifier(keyIndex)
				this.keys[identifier] = true
				this.emit('keyDown', identifier)
			})

			this.streamDeck.on('up', (keyIndex) => {
				const identifier = keyIndexToIdentifier(keyIndex)
				this.keys[identifier] = false
				this.emit('keyUp', identifier)
			})

			this.streamDeck.on('error', (error) => {
				if (`${error}`.match(/could not read from/)) {
					// disconnected
					this.connected = false
					this.emit('disconnected')
					this.streamDeck?.close().catch(console.error)
					delete this.streamDeck
				} else {
					console.error(error)
				}
			})
			await this._updateAllKeys('Initializing')

			this.initializing = false
		} catch (e) {
			this.initializing = false
			throw e
		}
	}
	async _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay, force = false): Promise<void> {
		if (!this.streamDeck) return

		if (!keyDisplay) keyDisplay = { attentionLevel: AttentionLevel.IGNORE }

		if (force || !_.isEqual(this.sentKeyDisplay[identifier], keyDisplay)) {
			this.sentKeyDisplay[identifier] = keyDisplay

			if (!this.connectedToParent) {
				// Intercept:

				if (identifier === '0') {
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

			await drawKeyDisplay(this.streamDeck, this.queue, identifierToKeyIndex(identifier), keyDisplay)
		}
	}
	async _updateAllKeys(specialMessage?: string): Promise<void> {
		if (!this.streamDeck) return

		if (!this.connectedToParent || specialMessage) {
			// We might as well clear everything a little early:
			await this.queue.add(async () => {
				await this.streamDeck?.clearPanel()
			})
		}

		for (let keyIndex = 0; keyIndex < this.streamDeck.NUM_KEYS; keyIndex++) {
			const identifier = keyIndexToIdentifier(keyIndex)
			let keyDisplay = this.sentKeyDisplay[identifier]

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

			await this._setKeyDisplay(identifier, keyDisplay, true)
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
		if (this.streamDeck) {
			this.connectedToParent = false
			await this._updateAllKeys('Closed')
		}
		await super._close()
		if (this.streamDeck) {
			await this.streamDeck.close()
		}
	}

	private emitAllKeys() {
		if (!this.streamDeck) return
		for (let keyIndex = 0; keyIndex < this.streamDeck.NUM_KEYS; keyIndex++) {
			const identifier = keyIndexToIdentifier(keyIndex)
			if (this.keys[identifier]) this.emit('keyDown', keyIndexToIdentifier(keyIndex))
			else this.emit('keyUp', keyIndexToIdentifier(keyIndex))
		}
	}
}
function keyIndexToIdentifier(keyIndex: number): string {
	return `${keyIndex}`
}
function identifierToKeyIndex(identifier: string): number {
	return parseInt(identifier)
}

export async function drawKeyDisplay(
	streamDeck: StreamDeck,
	queue: PQueue,
	keyIndex: number,
	keyDisplay: KeyDisplay,
	darkBG = false
) {
	const fontsize = 16
	const padding = 5
	const SIZE = streamDeck.ICON_SIZE

	const dampen = keyDisplay.attentionLevel === AttentionLevel.IGNORE
	const dampenBackground = dampen || keyDisplay.attentionLevel === AttentionLevel.ALERT

	let bgColor = '#000'
	let backgroundIsDark = true

	let x = 0
	let y = 0

	x = padding
	y = padding + fontsize
	let svg = ''
	const inputs: sharp.OverlayOptions[] = []

	// Background:
	let img: sharp.Sharp | null = null
	let hasBackground = false
	if (keyDisplay.thumbnail) {
		const uri = keyDisplay.thumbnail.split(';base64,').pop()

		if (uri) {
			try {
				const imgBuffer = Buffer.from(uri, 'base64')
				img = sharp(imgBuffer).trim().flatten().resize(SIZE, SIZE)
				// .modulate({
				// 	brightness: 0.5,
				// })
				// .blur()

				if (dampenBackground || darkBG) img.modulate({ brightness: 0.5 })

				img.blur()
				hasBackground = true
			} catch (e) {
				console.error('Error when processing thumbnail')
				console.error(e)
				img = null
			}
		}
	}
	// Calculate background brightness
	if (img) {
		const averagePixel = await img.clone().resize(1, 1).raw().toBuffer()

		const backgroundColor = {
			r: Number(averagePixel[0]),
			g: Number(averagePixel[1]),
			b: Number(averagePixel[1]),
		}
		/** 0 - 255 */
		const brightness = (backgroundColor.r * 299 + backgroundColor.g * 587 + backgroundColor.b * 114) / 1000

		backgroundIsDark = brightness < 127
	}

	// Border:
	{
		let borderWidth = 0
		let borderColor = '#000'

		if (keyDisplay.attentionLevel === AttentionLevel.IGNORE) {
			borderWidth = 0
			borderColor = '#000'
		} else if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
			borderWidth = 3
			borderColor = '#333'
		} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
			borderWidth = 3
			borderColor = '#bbb'
		} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
			borderColor = '#ff0'
			borderWidth = 4
		} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
			borderWidth = 10
			borderColor = '#f00'
			if (!hasBackground) {
				bgColor = '#ff3'
				backgroundIsDark = false
			}
		}

		if (borderWidth) {
			borderWidth += 3
			if (hasBackground) borderWidth += 3

			svg += `<rect
			    x="0"
			    y="0"
			    width="${SIZE}"
			    height="${SIZE}"
			    rx="10"
			    stroke="${borderColor}"
			    stroke-width="${borderWidth}"
                fill="none"
			/>`
		}
	}

	let textColor: string

	if (backgroundIsDark) {
		textColor = dampen ? '#999' : '#fff'
	} else {
		textColor = dampen ? '#333' : '#000'
	}

	if (keyDisplay.header) {
		const text = keyDisplay.header.short || keyDisplay.header.long.slice(0, 8)

		const textFontSize = Math.floor(fontsize * (text.length > 7 ? 0.8 : 1))
		svg += `<text
                    font-family="Arial, Helvetica, sans-serif"
                    font-size="${textFontSize}px"
                    x="${x}"
                    y="${y}"
                    fill="${textColor}"
                    text-anchor="start"
                    >${text}</text>`
		y += Math.max(textFontSize, fontsize)
	}
	if (keyDisplay.info) {
		const textFontSize = Math.floor(fontsize * 0.8)
		if (keyDisplay.info.short) {
			svg += `<text
                font-family="Arial, Helvetica, sans-serif"
                font-size="${textFontSize}px"
                x="${x}"
                y="${y}"
                fill="${textColor}"
                text-anchor="start"
                >${keyDisplay.info.short}</text>`
			y += textFontSize
		} else if (keyDisplay.info.long) {
			let text = keyDisplay.info.long

			if (text.includes('\n')) {
				const lines = text.split('\n')
				for (const line of lines) {
					if (line) {
						svg += `<text
							font-family="Arial, Helvetica, sans-serif"
							font-size="${textFontSize}px"
							x="${x}"
							y="${y}"
							fill="${textColor}"
							text-anchor="start"
							>${line}</text>`
						y += textFontSize
					} else {
						break
					}
				}
			} else {
				let line = ''
				const lineLength = 9
				for (let i = 0; i < 3; i++) {
					line = text.slice(0, lineLength)
					text = text.slice(lineLength)
					if (line) {
						svg += `<text
							font-family="Arial, Helvetica, sans-serif"
							font-size="${textFontSize}px"
							x="${x}"
							y="${y}"
							fill="${textColor}"
							text-anchor="start"
							>${line}</text>`
						y += textFontSize
					} else {
						break
					}
				}
			}
		}
	}

	if (svg) {
		inputs.push({
			input: Buffer.from(
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" version="1.1">${svg}</svg>`
			),
			top: 0,
			left: 0,
		})
	}

	let keyGotAnyContent = false

	if (!img) {
		img = sharp({
			create: {
				width: SIZE,
				height: SIZE,
				channels: 3,
				background: bgColor,
			},
		}).ensureAlpha()
	} else {
		keyGotAnyContent = true
	}

	if (inputs.length) {
		keyGotAnyContent = true
		img = img.composite(inputs)
	}

	const tmpImg = await img.raw().toBuffer()
	await queue.add(async () => {
		if (keyGotAnyContent) {
			await streamDeck.fillKeyBuffer(keyIndex, tmpImg, { format: 'rgba' })
		} else {
			await streamDeck.clearKey(keyIndex)
		}
	})
}
