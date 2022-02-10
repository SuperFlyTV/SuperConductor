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

		if (Array.isArray(keyDisplay)) {
			// It is a timeline, which means that we should resolve it and track it.

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
	private lastResolveTime = 0
	private updateCount = 0
	private currentState: any = null
	private timeout: NodeJS.Timeout | null = null
	private LAYER = '1'
	private callbackErrorCount = 0

	/** How far ahead to resolve */
	private RESOLVE_LIMIT_TIME = 10 * 60 * 1000
	private RESOLVE_LIMIT_COUNT = 20

	constructor(keyDisplayTimeline: KeyDisplayTimeline, private callback: (keyDisplay: KeyDisplay) => void) {
		this.timeline = keyDisplayTimeline.map((obj) => {
			return {
				layer: this.LAYER,
				...obj,
			}
		})

		this.update()
	}

	update(updateTime?: number) {
		if (this.callbackErrorCount > 10) {
			return
		}
		this.updateCount++
		const now: number = updateTime || Date.now()
		if (
			!this.resolvedStates ||
			now - this.lastResolveTime > this.RESOLVE_LIMIT_TIME ||
			this.updateCount > this.RESOLVE_LIMIT_COUNT
		) {
			this.lastResolveTime = now
			this.updateCount = 0
			this.resolvedStates = Resolver.resolveAllStates(
				Resolver.resolveTimeline(this.timeline, {
					time: this.lastResolveTime,
					limitTime: this.lastResolveTime + this.RESOLVE_LIMIT_TIME,
					limitCount: this.RESOLVE_LIMIT_COUNT,
				})
			)
		}
		const genericState = Resolver.getState(this.resolvedStates, now)

		const { currentState, changedAnything } = extendKeyDisplay(
			genericState.layers[this.LAYER]?.content as KeyDisplay
		)

		if (!_.isEqual(currentState, this.currentState)) {
			this.currentState = currentState

			try {
				this.callback(currentState as any as KeyDisplay)
			} catch (e) {
				console.error(e)
				this.callbackErrorCount++
			}
		}

		// Now that we've handled this point in time, it's time to determine what the next point in time is:
		let nextEventTime: number | null = null
		_.each(this.resolvedStates.nextEvents, (event) => {
			if (event.time && event.time > now && (!nextEventTime || event.time < nextEventTime)) {
				nextEventTime = event.time
			}
		})

		let nextResolveTime = this.lastResolveTime + this.RESOLVE_LIMIT_TIME
		if (nextEventTime) {
			nextResolveTime = Math.min(nextResolveTime, nextEventTime)
		}
		if (changedAnything) {
			nextResolveTime = Math.min(nextResolveTime, Date.now() + 200)
		}

		const timeUntilNextTime = nextResolveTime - Date.now()

		this.timeout = setTimeout(() => {
			this.update(nextResolveTime + 1)
		}, timeUntilNextTime)
	}
	stop() {
		if (this.timeout) {
			clearTimeout(this.timeout)
		}
	}
}

function extendKeyDisplay(currentState0: Partial<KeyDisplay>): {
	currentState: KeyDisplay
	changedAnything: boolean
} {
	const currentState: KeyDisplay = {
		attentionLevel: AttentionLevel.IGNORE,

		...deepClone(currentState0),
	}

	const changedAnything = { change: false }

	if (currentState.header?.long) currentState.header.long = fixString(currentState.header.long, changedAnything)
	if (currentState.header?.short) currentState.header.short = fixString(currentState.header.short, changedAnything)
	if (currentState.info?.long) currentState.info.long = fixString(currentState.info.long, changedAnything)
	if (currentState.info?.short) currentState.info.short = fixString(currentState.info.short, changedAnything)

	return {
		currentState,
		changedAnything: changedAnything.change,
	}
}

function fixString(text: string, changedAnything: { change: boolean }): string {
	{
		const regex = /#duration\((\d+)\)/i
		const m = text.match(regex)
		if (m) {
			const time = Number(m[1])
			if (time) {
				text = text.replace(regex, formatTime(time / 1000))
			}
		}
	}
	{
		const regex = /#countdown\((\d+)\)/i
		const m = text.match(regex)
		if (m) {
			const time = Number(m[1])
			if (time) {
				text = text.replace(regex, formatTime(Math.max(0, Math.ceil((time - Date.now()) / 1000))))
				changedAnything.change = true
			}
		}
	}

	return text
}

function formatTime(time: number) {
	// format hh:mm:ss

	const h = Math.floor(time / 3600)
	const m = Math.floor((time % 3600) / 60)
	const s = Math.floor(time % 60)
	return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
}
export function deepClone<T>(data: T): T {
	return JSON.parse(JSON.stringify(data))
}
