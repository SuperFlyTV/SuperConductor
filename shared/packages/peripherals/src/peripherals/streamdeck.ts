import { KeyDisplay } from '@shared/api'
import { openStreamDeck, listStreamDecks, StreamDeck, DeviceModelId } from '@elgato-stream-deck/node'
import { Peripheral } from './peripheral'

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
	setKeyDisplay(keyInfo: KeyDisplay): void {
		// TODO: implement this
		console.log('setKeyDisplay', keyInfo)
	}
	async close() {
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
}
