import winston from 'winston'
import { KeyDisplay, KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import {
	ResolvedStates,
	ResolvedTimelineObjectInstance,
	Resolver,
	TimelineObject,
	TimelineObjectInstance,
} from 'superfly-timeline'
import _ from 'lodash'
import { deepClone } from './lib'

export class TimelineTracker {
	private timeline: TimelineObject[]
	private resolvedStates: ResolvedStates | null = null
	private lastResolveTime = 0
	private updateCount = 0
	private currentState: any = null
	private timeout: NodeJS.Timeout | null = null
	private LAYER = 'KEY'
	private callbackErrorCount = 0

	/** How far ahead to resolve */
	private RESOLVE_LIMIT_TIME = 10 * 60 * 1000
	private RESOLVE_LIMIT_COUNT = 20

	constructor(
		private log: winston.Logger,
		keyDisplayTimeline: KeyDisplayTimeline,
		private callback: (keyDisplay: KeyDisplay) => void
	) {
		this.timeline = keyDisplayTimeline.map((obj) => {
			return {
				// layer: this.LAYER,
				...obj,
			}
		})

		this._update()
	}

	private _update(updateTime?: number) {
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

		const layer: ResolvedTimelineObjectInstance | undefined = genericState.layers[this.LAYER]

		const { currentState, changedAnything } = layer
			? extendKeyDisplay(layer.content as KeyDisplay, layer.instance)
			: {
					currentState: {
						attentionLevel: AttentionLevel.IGNORE,
					},
					changedAnything: { changedAnything: false },
			  }

		// console.log('state', genericState.layers[this.LAYER].instance)

		// console.log('currentState', currentState)

		if (!_.isEqual(currentState, this.currentState)) {
			this.currentState = currentState

			try {
				this.callback(currentState as any as KeyDisplay)
			} catch (e) {
				this.log.error(e)
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
		// console.log('timeUntilNextTime', timeUntilNextTime)

		this.timeout = setTimeout(() => {
			this._update(nextResolveTime + 1)
		}, timeUntilNextTime)
	}
	stop() {
		if (this.timeout) {
			clearTimeout(this.timeout)
		}
	}
}

function extendKeyDisplay(
	currentState0: Partial<KeyDisplay>,
	instance: TimelineObjectInstance
): {
	currentState: KeyDisplay
	changedAnything: boolean
} {
	const currentState: KeyDisplay = {
		attentionLevel: AttentionLevel.IGNORE,

		...deepClone(currentState0),
	}

	const changedAnything = { change: false }

	if (currentState.header?.long)
		currentState.header.long = fixString(currentState.header.long, instance, changedAnything)
	if (currentState.header?.short)
		currentState.header.short = fixString(currentState.header.short, instance, changedAnything)
	if (currentState.info?.long) currentState.info.long = fixString(currentState.info.long, instance, changedAnything)
	if (currentState.info?.short)
		currentState.info.short = fixString(currentState.info.short, instance, changedAnything)

	return {
		currentState,
		changedAnything: changedAnything.change,
	}
}

function fixString(text: string, instance: TimelineObjectInstance, changedAnything: { change: boolean }): string {
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
	{
		const regex = /#timeToEnd/i
		const m = text.match(regex)
		if (m) {
			const time = instance.originalEnd || instance.end
			if (time) {
				text = text.replace(regex, formatTime(Math.max(0, Math.ceil((time - Date.now()) / 1000))))
				changedAnything.change = true
			} else if (time === null) {
				text = text.replace(regex, '')
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
