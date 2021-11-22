import { GroupModel } from '@/models/GroupModel'
import { GroupPreparedPlayheadData } from '@/models/PlayheadData'
import { RundownModel } from '@/models/RundownModel'
import { findRundown } from './util'

/** Calculates how the rundowns in a group is going to be played
 * @see GroupPreparedPlayheadData
 */
export function prepareGroupPlayhead(group: GroupModel): GroupPreparedPlayheadData | null {
	if (group.playing) {
		const data: GroupPreparedPlayheadData = {
			startTime: 0,
			duration: 0,
			rundowns: [],
			repeating: null,
		}
		data.startTime = group.playing.startTime

		const startRundown = findRundown(group, group.playing.startRundownId)
		if (startRundown) {
			let currentRundown: RundownModel = startRundown

			const queuedRundowns: RundownModel[] = []
			for (const rundownId of group.playing.queuedRundownIds) {
				const rundown = findRundown(group, rundownId)
				if (rundown) queuedRundowns.push(rundown)
			}

			if (group.loop && !group.autoPlay) {
				// Only loop the one rundown:

				// Add the rudown into .repeating instead, to make it loop:
				data.rundowns = []
				data.duration = 0 // Becase .rundowns is empty
				data.repeating = {
					duration: startRundown.resolved.duration,
					rundowns: [
						{
							startTime: 0,
							rundown: startRundown,
						},
					],
				}
			} else {
				/** The startTime of the next Rundown. */
				let nextStartTime = 0

				// Add the starting Rundown:
				data.rundowns.push({
					startTime: nextStartTime,
					rundown: startRundown,
				})
				currentRundown = startRundown
				nextStartTime += startRundown.resolved.duration
				data.duration = nextStartTime // Note: This might be overwritten later..

				// Add the queued Rundowns:
				for (const rundown of queuedRundowns) {
					data.rundowns.push({
						startTime: nextStartTime,
						rundown,
					})
					currentRundown = rundown
					nextStartTime += rundown.resolved.duration
				}
				data.duration = nextStartTime

				if (group.autoPlay) {
					// Add the rest of the Rundowns in the group:
					const currentRundownIndex = group.rundowns.findIndex((r) => r.id === currentRundown.id)
					const restRundowns = group.rundowns.slice(currentRundownIndex + 1)

					for (const rundown of restRundowns) {
						data.rundowns.push({
							startTime: nextStartTime,
							rundown: rundown,
						})
						nextStartTime += rundown.resolved.duration
					}
					data.duration = nextStartTime

					// Looping rundowns:
					if (group.loop) {
						data.repeating = {
							duration: 0,
							rundowns: [],
						}

						let startTime = 0
						for (const rundown of group.rundowns) {
							data.repeating.rundowns.push({
								startTime: startTime,
								rundown: rundown,
							})
							startTime += rundown.resolved.duration
						}
						data.repeating.duration = startTime
					}
				}
			}
		}
		return data
	}
	return null
}

/**
 * Calculates which rundown in GroupPreparedPlayheadData is currently on-air, and how far in it we currently are.
 */
export function getGroupPlayhead(data: GroupPreparedPlayheadData | null): GroupPlayhead | null {
	if (data) {
		const now = Date.now()

		if (now >= data.startTime && now < data.startTime + data.duration) {
			for (const rundown of data.rundowns) {
				const rundownStartTime = data.startTime + rundown.startTime
				const rundownEndTime = rundownStartTime + rundown.rundown.resolved.duration

				if (now >= rundownStartTime && now < rundownEndTime) {
					return {
						rundownId: rundown.rundown.id,
						playheadTime: now - rundownStartTime,
						rundownEndTime: rundown.rundown.resolved.duration,

						isInRepeating: false,
					}
				}
			}
		} else if (data.repeating && now >= data.startTime + data.duration) {
			// In the repeating section

			const repeatingStartTime = data.startTime + data.duration
			const nowInRepeating = (now - repeatingStartTime) % data.repeating.duration

			for (const rundown of data.repeating.rundowns) {
				const rundownEndTime = rundown.startTime + rundown.rundown.resolved.duration
				if (nowInRepeating >= rundown.startTime && nowInRepeating < rundownEndTime) {
					return {
						rundownId: rundown.rundown.id,
						playheadTime: nowInRepeating - rundown.startTime,
						rundownEndTime: rundown.rundown.resolved.duration,

						isInRepeating: true,
					}
				}
			}
		}
	}

	return null
}
export interface GroupPlayhead {
	rundownId: string
	playheadTime: number
	rundownEndTime: number

	/** Whether the playhead has entered the repeating part of rundowns */
	isInRepeating: boolean
}
