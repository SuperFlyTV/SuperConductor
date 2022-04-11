import { EventEmitter } from 'events'
import { KeyDisplay, KeyDisplayTimeline, PeripheralInfo } from '@shared/api'
import { TimelineTracker } from '@shared/lib'

export interface PeripheralEvents {
	connected: () => void
	disconnected: () => void

	keyDown: (identifier: string) => void
	keyUp: (identifier: string) => void
}
export declare interface Peripheral {
	on<U extends keyof PeripheralEvents>(event: U, listener: PeripheralEvents[U]): this
	emit<U extends keyof PeripheralEvents>(event: U, ...args: Parameters<PeripheralEvents[U]>): boolean
}
export abstract class Peripheral extends EventEmitter {
	private trackers: { [ident: string]: TimelineTracker } = {}
	constructor(
		/** Locally unique id */
		public readonly id: string
	) {
		super()
	}

	abstract get info(): PeripheralInfo

	public setKeyDisplay(identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline): void {
		if (this.trackers[identifier]) {
			this.trackers[identifier].stop()
			delete this.trackers[identifier]
		}

		// console.log('setKeyDisplay', JSON.stringify(keyDisplay))

		if (Array.isArray(keyDisplay)) {
			// It is a timeline, which means that we should resolve it and track it.

			this.trackers[identifier] = new TimelineTracker(keyDisplay, (keyDisplay) => {
				this._setKeyDisplay(identifier, keyDisplay).catch(console.error)
			})
		} else {
			this._setKeyDisplay(identifier, keyDisplay).catch(console.error)
		}
	}
	protected abstract _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay): Promise<void>
	protected async _close(): Promise<void> {
		for (const tracker of Object.values(this.trackers)) {
			tracker.stop()
		}
		this.trackers = {}
	}
	abstract setConnectedToParent(connected: boolean): Promise<void>
	abstract close(): Promise<void>
}
