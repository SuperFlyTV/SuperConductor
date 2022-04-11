import { EventEmitter } from 'events'
import { AttentionLevel, KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import {
	ResolvedStates,
	ResolvedTimelineObjectInstance,
	Resolver,
	TimelineObject,
	TimelineObjectInstance,
} from 'superfly-timeline'
import _ from 'lodash'
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
	/** User-diaplayable name */
	protected _name = ''
	private trackers: { [ident: string]: TimelineTracker } = {}
	constructor(
		/** Locally unique id */
		public readonly id: string
	) {
		super()
	}

	public get name(): string {
		if (!this._name) throw new Error(`Peripheral "${this.id}" has no name`)
		return this._name
	}

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
