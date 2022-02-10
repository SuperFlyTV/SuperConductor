import { AttentionLevel, KeyDisplay } from '@shared/api'
import _ from 'lodash'
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
	private sentKeyDisplay: { [identifier: string]: KeyDisplay } = {}
	private sentFrequency = 0
	private sentBacklight: {
		[identifier: string]: {
			color: string
			flashing: boolean
		}
	} = {}

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

			this.xkeysPanel.setAllBacklights(null)
			this.xkeysPanel.setIndicatorLED(1, true) // green
			this.xkeysPanel.setIndicatorLED(2, false) // red
			setTimeout(() => {
				this.emitAllKeys()
			}, 100)
			this.initializing = false
		} catch (e) {
			this.initializing = false
			throw e
		}
	}
	_setKeyDisplay(identifier: string, keyDisplay: KeyDisplay, force = false): void {
		const keyIndex = parseInt(identifier)

		if (!this.xkeysPanel) return
		if (force || !_.isEqual(this.sentKeyDisplay[identifier], keyDisplay)) {
			this.sentKeyDisplay[identifier] = keyDisplay

			let color = 'black'
			// let flashing = AttentionLevel.IGNORE

			if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
				color = 'blue'
			} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
				color = 'red'
			} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
				color = 'red' // flashing slowly
			} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
				color = 'white' // flashing quickly
			}

			const worstAttentionLevel = Object.values(this.sentKeyDisplay).reduce(
				(prev, keyDisplay) => Math.max(keyDisplay.attentionLevel, prev),
				AttentionLevel.IGNORE
			)

			let frequency = 0
			if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) frequency = 50
			else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) frequency = 10

			let worstFrequency = 0
			if (worstAttentionLevel === AttentionLevel.NOTIFY) worstFrequency = 50
			else if (worstAttentionLevel === AttentionLevel.ALERT) worstFrequency = 10

			let notifyAll = false
			if (!force) {
				if (worstFrequency !== this.sentFrequency) {
					this.sentFrequency = worstFrequency
					if (worstFrequency) {
						this.xkeysPanel.setFrequency(worstFrequency)
					}
					notifyAll = true
				}
			}

			const flashing = frequency > 0 && frequency === worstFrequency

			const backlight = {
				color,
				flashing,
			}
			if (!_.isEqual(backlight, this.sentBacklight[identifier])) {
				this.sentBacklight[identifier] = backlight
				this.xkeysPanel.setBacklight(keyIndex, color, flashing)

				if (notifyAll) {
					this._updateAllKeys()
				}
			}
		}
	}
	async close() {
		await super._close()
		if (this.xkeysPanel) {
			await this.xkeysPanel.close()
		}
	}
	private _updateAllKeys() {
		for (const [identifier, keyDisplay] of Object.entries(this.sentKeyDisplay)) {
			this._setKeyDisplay(identifier, keyDisplay, true)
		}
	}
	private emitAllKeys() {
		if (!this.xkeysPanel) return

		const buttons = this.xkeysPanel.getButtons()

		for (const [keyIndex, value] of Array.from(buttons.entries())) {
			this.emit(value ? 'keyDown' : 'keyUp', `${keyIndex}`)
		}
	}
}
