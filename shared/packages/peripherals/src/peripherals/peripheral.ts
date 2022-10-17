import { EventEmitter } from 'events'
import { KnownPeripheral, KeyDisplay, KeyDisplayTimeline, LoggerLike, PeripheralInfo } from '@shared/api'
import { TimelineTracker } from '@shared/lib'

export interface PeripheralEvents {
	initialized: () => void
	connected: () => void
	disconnected: () => void

	keyDown: (identifier: string) => void
	keyUp: (identifier: string) => void
}
export declare interface Peripheral {
	on<U extends keyof PeripheralEvents>(event: U, listener: PeripheralEvents[U]): this
	emit<U extends keyof PeripheralEvents>(event: U, ...args: Parameters<PeripheralEvents[U]>): boolean
}
export type onKnownPeripheralCallback = (peripheralId: string, details: KnownPeripheral | null) => void
export abstract class Peripheral extends EventEmitter {
	private trackers: { [ident: string]: TimelineTracker } = {}
	constructor(
		protected log: LoggerLike,
		/** Locally unique id */
		public readonly id: string
	) {
		super()
	}

	abstract get info(): PeripheralInfo
	/** True if connected to the peripheral */
	public connected = false
	/** True if in the process of connecting to the peripheral */
	public initializing = false

	public setKeyDisplay(identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline): void {
		if (this.trackers[identifier]) {
			this.trackers[identifier].stop()
			delete this.trackers[identifier]
		}

		if (Array.isArray(keyDisplay)) {
			// It is a timeline, which means that we should resolve it and track it.

			this.trackers[identifier] = new TimelineTracker(this.log, keyDisplay, (keyDisplay) => {
				this._setKeyDisplay(identifier, keyDisplay).catch(this.log.error)
			})
		} else {
			this._setKeyDisplay(identifier, keyDisplay).catch(this.log.error)
		}
	}
	protected abstract _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay): Promise<void>
	protected async _close(): Promise<void> {
		for (const tracker of Object.values(this.trackers)) {
			tracker.stop()
		}
		this.trackers = {}

		if (this.initializing) {
			// We have to wait for the peripheral to finish initializing before we can close it.
			await new Promise<void>((resolve, reject) => {
				let handled = false

				const timeout = setTimeout(() => {
					if (handled) return
					handled = true
					reject(new Error('Timed out while waiting for peripheral to initialize'))
				}, 2500)

				this.once('initialized', () => {
					if (handled) return
					handled = true
					clearTimeout(timeout)
					resolve()
				})
			})
		}
	}
	abstract setConnectedToParent(connected: boolean): Promise<void>
	abstract init(): Promise<void>
	abstract close(): Promise<void>
}
