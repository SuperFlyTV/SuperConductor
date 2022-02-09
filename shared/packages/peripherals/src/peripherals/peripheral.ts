import { EventEmitter } from 'events'
import { KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import { NextEvent, ResolvedStates, Resolver, TimelineObject, TimelineState } from 'superfly-timeline'
import _ from 'lodash'

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
		if (Array.isArray(keyDisplay)) {
			// It is a timeline, which means that we should resolve it and track it.

			if (this.trackers[identifier]) {
				this.trackers[identifier].stop()
			}
			this.trackers[identifier] = new TimelineTracker(keyDisplay, (keyDisplay) => {
				this._setKeyDisplay(identifier, keyDisplay)
			})
		} else {
			this._setKeyDisplay(identifier, keyDisplay)
		}
	}
	protected abstract _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay): void
	protected async _close(): Promise<void> {
		for (const tracker of Object.values(this.trackers)) {
			tracker.stop()
		}
		this.trackers = {}
	}
	abstract close(): Promise<void>
}

class TimelineTracker {
	private timeline: TimelineObject[]
	private resolvedStates: ResolvedStates | null = null
	private resolveTime = 0
	private currentState: any = null
	private timeout: NodeJS.Timeout | null = null
	private LAYER = '1'

	/** How far ahead to resolve */
	private RESOLVE_LIMIT = 10 * 60 * 1000

	constructor(keyDisplayTimeline: KeyDisplayTimeline, private callback: (keyDisplay: KeyDisplay) => void) {
		this.timeline = keyDisplayTimeline.map((obj) => {
			return {
				layer: this.LAYER,
				...obj,
			}
		})

		this.update()
	}

	update() {
		if (!this.resolvedStates || Date.now() - this.resolveTime > this.RESOLVE_LIMIT) {
			this.resolveTime = Date.now()
			this.resolvedStates = Resolver.resolveAllStates(
				Resolver.resolveTimeline(this.timeline, {
					time: this.resolveTime,
					limitTime: this.resolveTime + this.RESOLVE_LIMIT,
				})
			)
		}

		const currentState = Resolver.getState(this.resolvedStates, this.resolveTime)

		if (!_.isEqual(currentState, this.currentState)) {
			this.currentState = currentState

			const keyDisplay = currentState.layers[this.LAYER].content as KeyDisplay

			this.callback(keyDisplay)
		}

		const nextEvent: NextEvent | undefined = this.resolvedStates.nextEvents[0]
		const nextTime = nextEvent?.time || this.resolveTime + this.RESOLVE_LIMIT

		this.timeout = setTimeout(() => {
			this.update()
		}, nextTime - Date.now())
	}
	stop() {
		if (this.timeout) {
			clearTimeout(this.timeout)
		}
	}
}
