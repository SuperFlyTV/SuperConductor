import { KeyDisplay } from '@shared/api'
import { XKeysWatcher, XKeys } from 'xkeys'
import { Peripheral } from './peripheral'

export class PeripheralXkeys extends Peripheral {
	static Watch(onDevice: (peripheral: PeripheralXkeys) => void) {
		const watcher = new XKeysWatcher({
			automaticUnitIdMode: true,
			// usePolling: true,
			// pollingInterval: 1000,
		})

		watcher.on('connected', (xkeysPanel) => {
			const id = `xkeys-${xkeysPanel.uniqueId}`

			console.log('Connected', id)

			const newDevice = new PeripheralXkeys(id, xkeysPanel)

			newDevice
				.init()
				.then(() => onDevice(newDevice))
				.catch(console.error)
		})

		return {
			stop: () => watcher.stop().catch(console.error),
		}
	}

	public initializing = false
	public connected = false

	constructor(id: string, private xkeysPanel: XKeys) {
		super(id)
	}

	async init(): Promise<void> {
		try {
			this.initializing = true

			const name = this.xkeysPanel.info.name
			this._name = name

			this.xkeysPanel.on('down', (keyIndex) => {
				this.emit('keyDown', `${keyIndex}`)
			})
			this.xkeysPanel.on('up', (keyIndex) => {
				this.emit('keyUp', `${keyIndex}`)
			})

			this.xkeysPanel.on('disconnected', () => {
				this.emit('disconnected')
			})
			this.xkeysPanel.on('reconnected', () => {
				this.emit('connected')
			})

			this.xkeysPanel.on('error', console.error)

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
		if (this.xkeysPanel) {
			await this.xkeysPanel.close()
		}
	}
	private emitAllKeys() {
		if (!this.xkeysPanel) return
		const buttons = this.xkeysPanel.getButtons()

		for (const [keyIndex, value] of Object.entries(buttons)) {
			this.emit(value ? 'keyDown' : 'keyUp', `key_${keyIndex}`)
		}
	}
}
