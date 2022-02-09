// import path from 'path'
import _ from 'lodash'
import sharp from 'sharp'
import { KeyDisplay } from '@shared/api'
import { openStreamDeck, listStreamDecks, StreamDeck, DeviceModelId } from '@elgato-stream-deck/node'
import { Peripheral } from './peripheral'
// import PImage from 'pureimage'
// import streamBuffers from 'stream-buffers'
// import { Bitmap } from 'pureimage/types/bitmap'

export class PeripheralStreamDeck extends Peripheral {
	private sentKeyDisplay: { [identifier: string]: KeyDisplay } = {}
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
				this.emit('keyDown', `${keyIndex}`)
			})

			this.streamDeck.on('up', (keyIndex) => {
				this.emit('keyUp', `${keyIndex}`)
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
			this.emitAllKeys()
			this.initializing = false
		} catch (e) {
			this.initializing = false
			throw e
		}
	}
	_setKeyDisplay(identifier: string, keyDisplay: KeyDisplay): void {
		// TODO: implement this
		console.log('setKeyDisplay', keyDisplay)

		const keyIndex = parseInt(identifier)

		if (!this.streamDeck) return
		if (!_.isEqual(this.sentKeyDisplay[identifier], keyDisplay)) {
			this.sentKeyDisplay[identifier] = keyDisplay

			// const ICON_SIZE = this.streamDeck.ICON_SIZE
			// const textString = `FOO`
			// const img = PImage.make(ICON_SIZE, ICON_SIZE, {})
			// const ctx = img.getContext('2d')
			// ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE) // As of v0.1, pureimage fills the canvas with black by default.
			// ctx.font = {
			// 	family: 'Source Sans Pro',
			// 	size: 16,
			// }

			// // ctx.USE_FONT_GLYPH_CACHING = false
			// ctx.strokeStyle = 'black'
			// ctx.lineWidth = 3
			// ctx.strokeText(textString, 8, 60)
			// ctx.fillStyle = '#ffffff'
			// ctx.fillText(textString, 8, 60)

			this.writeImage(keyIndex).catch(console.error)
		}
	}
	async close() {
		await super._close()
		if (this.streamDeck) {
			await this.streamDeck.close()
		}
	}
	private emitAllKeys() {
		if (!this.streamDeck) return
		// Assume all keys are up:
		for (let keyIndex = 0; keyIndex < this.streamDeck.NUM_KEYS; keyIndex++) {
			this.emit('keyUp', `key_${keyIndex}`)
		}
	}
	private async writeImage(keyIndex: number) {
		if (!this.streamDeck) return

		// const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
		// 	initialSize: 20736, // Start at what should be the exact size we need
		// 	incrementAmount: 1024, // Grow by 1 kilobyte each time buffer overflows.
		// })

		try {
			// await PImage.encodePNGToStream(img, writableStreamBuffer)

			// // const buf = await sharp()
			// const contentsBuffer = writableStreamBuffer.getContents()
			// if (!contentsBuffer) throw new Error('No contents')

			// const finalBuffer = await sharp()
			// 	.resize(this.streamDeck.ICON_SIZE, this.streamDeck.ICON_SIZE)
			// 	.composite([{ input: contentsBuffer }])
			// 	.flatten()
			// 	.raw()
			// 	.toBuffer()
			// await this.streamDeck.fillKeyBuffer(keyIndex, finalBuffer, { format: 'rgba' })

			console.log('WRITING!!!!')

			const fontsize = 10
			const x = 0
			const y = 0
			const align = 'left'
			const text = 'TEST'

			const img = sharp({
				create: {
					width: this.streamDeck.ICON_SIZE,
					height: this.streamDeck.ICON_SIZE,
					channels: 3,
					background: {
						r: 0,
						g: 0,
						b: 0,
						alpha: 1 / 255,
					},
				},
			}).composite([
				{
					input: Buffer.from(
						`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.streamDeck.ICON_SIZE} ${this.streamDeck.ICON_SIZE}" version="1.1">
							<text
								font-family="'sans-serif'"
								font-size="${fontsize}px"
								x="${x}"
								y="${y}"
								fill="#fff"
								text-anchor="${align}"
								>${text}</text>
						</svg>`
					),
					top: this.streamDeck.ICON_SIZE - 20,
					left: 10,
				},
			])

			const tmpImg = await img.raw().toBuffer()

			await this.streamDeck.fillKeyBuffer(keyIndex, tmpImg, { format: 'rgba' })

			console.log('WRITING!!!! DONE!!!!!!!!!')
		} catch (error) {
			console.error(error)
		}
	}
}
