import { EventEmitter } from 'events'
import {
	KnownPeripheral,
	KeyDisplay,
	KeyDisplayTimeline,
	LoggerLike,
	PeripheralInfo,
	AnalogValue,
	PeripheralId,
} from '@shared/api'
import { TimelineTracker } from '@shared/lib'

export interface PeripheralEvents {
	initialized: () => void
	connected: () => void
	disconnected: () => void

	keyDown: (identifier: string) => void
	keyUp: (identifier: string) => void

	analog: (identifier: string, value: AnalogValue) => void
}
export declare interface Peripheral {
	on<U extends keyof PeripheralEvents>(event: U, listener: PeripheralEvents[U]): this
	emit<U extends keyof PeripheralEvents>(event: U, ...args: Parameters<PeripheralEvents[U]>): boolean
}
export type onKnownPeripheralCallback = (peripheralId: PeripheralId, details: KnownPeripheral | null) => void

export interface WatchReturnType {
	stop: () => void
}

export abstract class Peripheral extends EventEmitter {
	private trackers: { [ident: string]: TimelineTracker } = {}
	constructor(
		protected log: LoggerLike,
		/** Locally unique id */
		public readonly id: PeripheralId
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
		this.previousValuesForAbsolute.clear()

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

	private previousValuesForRelative = new Map<string, number>() // Stores previous absolute values
	/** Compares a value with previous value and returns the delta */
	protected getRelativeValue(identifier: string, absoluteValue: number): number {
		const previousValue = this.previousValuesForRelative.get(identifier)
		let deltaValue: number
		if (previousValue === undefined) {
			deltaValue = 0
		} else {
			deltaValue = absoluteValue - previousValue
		}
		this.previousValuesForRelative.set(identifier, absoluteValue)
		return deltaValue
	}
	private previousValuesForAbsolute = new Map<string, number>() // Stores previous absolute values
	/** Adds a value to previous value and returns an absolute value */
	protected getAbsoluteValue(identifier: string, relativeValue: number): number {
		const previousValue = this.previousValuesForAbsolute.get(identifier)

		const absoluteValue = (previousValue ?? 0) + relativeValue
		this.previousValuesForAbsolute.set(identifier, absoluteValue)

		return absoluteValue
	}
}
