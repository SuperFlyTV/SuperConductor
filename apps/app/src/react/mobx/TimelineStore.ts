import { makeAutoObservable, runInAction } from 'mobx'
import { Group } from '../../models/rundown/Group'
import { getTimelineForGroup } from '../../lib/timeline'
import { Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import _ from 'lodash'
import { ResolvedStates, ResolvedTimeline, Resolver, ResolverCacheInternal, TimelineState } from 'superfly-timeline'
import { NextEvent } from 'superfly-timeline'
import { Project } from '../../models/project/Project'
const { ipcRenderer } = window.require('electron')

export class TimelineStore {
	private _groupTimelines: Map<string, TSRTimeline>
	private _mappings: Mappings

	private triggreUpdateTimelineTimer: NodeJS.Timeout | undefined
	private triggreUpdateTimelineNextTriggerTime: number | undefined
	private triggreUpdateTimelineIsRunning: boolean
	private triggreUpdateTimelineRunAgain: boolean

	private resolvedTimelineInvalidateTime: number | undefined
	private resolvedStateInvalidateTime: number | undefined
	private resolveCache: Partial<ResolverCacheInternal> | undefined

	// Reactive data sources:
	private resolvedAllStates: ResolvedStates | undefined = undefined
	private resolvedState: TimelineState | undefined = undefined

	constructor() {
		makeAutoObservable(this)

		// non-reactive:
		this._groupTimelines = new Map<string, TSRTimeline>()
		this._mappings = {}

		this.triggreUpdateTimelineTimer = undefined
		this.triggreUpdateTimelineNextTriggerTime = undefined
		this.triggreUpdateTimelineIsRunning = false
		this.triggreUpdateTimelineRunAgain = false

		this.resolvedTimelineInvalidateTime = undefined
		this.resolvedStateInvalidateTime = undefined
		this.resolveCache = undefined
	}

	updateGroup(group: Group): void {
		const timeline = getTimelineForGroup(group, group.preparedPlayData, undefined) as TSRTimeline

		if (!_.isEqual(this._groupTimelines.get(group.id), timeline)) {
			this.resolvedTimelineInvalidateTime = undefined
			if (timeline) {
				this._groupTimelines.set(group.id, timeline)
			} else {
				this._groupTimelines.delete(group.id)
			}
			this.triggerUpdateTimeline(undefined)
		}
	}
	updateProject(project: Project): void {
		if (!_.isEqual(this._mappings, project.mappings)) {
			this._mappings = project.mappings
			this.resolvedTimelineInvalidateTime = undefined
			this.triggerUpdateTimeline(undefined)
		}
	}
	/** Returns the resolved Timeline. */
	getResolvedTimeline(): ResolvedStates | undefined {
		return this.resolvedAllStates
	}
	/** Returns the current Timeline State. */
	getState(): TimelineState | undefined {
		return this.resolvedState
	}

	private triggerUpdateTimeline(triggerTime: number | undefined) {
		const now = Date.now()
		triggerTime = triggerTime || now

		if (!this.triggreUpdateTimelineNextTriggerTime || triggerTime < this.triggreUpdateTimelineNextTriggerTime) {
			if (this.triggreUpdateTimelineTimer) clearTimeout(this.triggreUpdateTimelineTimer)

			this.triggreUpdateTimelineNextTriggerTime = triggerTime

			this.triggreUpdateTimelineTimer = setTimeout(() => {
				this.triggreUpdateTimelineTimer = undefined
				this.triggreUpdateTimelineNextTriggerTime = undefined

				if (this.triggreUpdateTimelineIsRunning) {
					// Is already running, schedule another run:
					this.triggreUpdateTimelineRunAgain = true
				} else {
					this.triggreUpdateTimelineIsRunning = true
					this.updateTimeline()
						.then(() => {
							this.triggreUpdateTimelineIsRunning = false
						})
						.catch((e) => {
							this.triggreUpdateTimelineIsRunning = false
							console.error(e)
						})
						.finally(() => {
							if (this.triggreUpdateTimelineRunAgain) {
								this.triggreUpdateTimelineRunAgain = false
								this.triggerUpdateTimeline(undefined)
							}
						})
				}
			}, triggerTime - now)
		}
	}
	private async updateTimeline() {
		const fullTimeline: TSRTimeline = []

		for (const timeline of this._groupTimelines.values()) {
			for (const obj of timeline) {
				fullTimeline.push(obj)
			}
		}

		const now = Date.now()
		if (!this.resolvedTimelineInvalidateTime || now >= this.resolvedTimelineInvalidateTime) {
			// It's time to re-resolve the timeline:

			const resolveDuration = 60 * 1000 // a minute
			this.resolvedTimelineInvalidateTime = now + resolveDuration

			const resolved = Resolver.resolveTimeline(fullTimeline, {
				time: Date.now(),
				limitTime: this.resolvedTimelineInvalidateTime,
				cache: this.resolveCache,
			})

			await sleep(1) // sleep a bit before continuing, to minimize blocking of main thread
			if (!this.resolvedTimelineInvalidateTime) {
				// It seems that the data has been updated, abort and trigger another run, since this resolve is already invalid now
				this.triggerUpdateTimeline(undefined)
				return
			}

			const allStates = Resolver.resolveAllStates(resolved, this.resolveCache)

			await sleep(1) // sleep a bit before continuing, to minimize blocking of main thread
			if (!this.resolvedTimelineInvalidateTime) {
				// It seems that the data has been updated, abort and trigger another run, since this resolve is already invalid now
				this.triggerUpdateTimeline(undefined)
				return
			}

			runInAction(() => {
				this.resolvedAllStates = allStates
			})

			this.resolvedStateInvalidateTime = undefined
		}

		if (!this.resolvedStateInvalidateTime || now >= this.resolvedStateInvalidateTime) {
			// It's time to re-resolve the timeline state:

			if (this.resolvedAllStates) {
				const resolvedState = Resolver.getState(this.resolvedAllStates, now)
				runInAction(() => {
					this.resolvedState = resolvedState
				})

				const nextEvent = resolvedState.nextEvents[0] as NextEvent | undefined
				if (nextEvent) {
					this.resolvedStateInvalidateTime = nextEvent.time
				} else {
					this.resolvedStateInvalidateTime = Infinity
				}
			}
		}

		// Schedule next time the trigger has to run:
		const nextTriggerTime = Math.min(
			this.resolvedStateInvalidateTime || Infinity,
			this.resolvedTimelineInvalidateTime || Infinity
		)
		if (nextTriggerTime !== Infinity) {
			this.triggerUpdateTimeline(nextTriggerTime)
		}
	}
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
