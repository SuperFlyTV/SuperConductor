import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
import { findRundown } from './util'

/** Calculates how the rundowns in a group is going to be played
 * @see GroupPreparedPlayheadData
 */
export function prepareGroupPlayhead(group: GroupModel): GroupPreparedPlayheadData | null {
	const data: GroupPreparedPlayheadData = {
		startTime: 0,
		duration: 0,
		rundowns: [],
		repeating: null,
	}

	if (group.playing) {
		data.startTime = group.playing.startTime

		const startRundown = findRundown(group, group.playing.startRundownId)
		if (startRundown) {
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
				let nextStartTime = 0

				data.rundowns.push({
					startTime: nextStartTime,
					rundown: startRundown,
				})
				data.duration = startRundown.resolved.duration // might be overwritten later..
				nextStartTime += startRundown.resolved.duration

				if (group.autoPlay) {
					// Add the rest of the rundowns in the group into the timeline:
					const startRundownIndex = group.rundowns.findIndex((r) => r.id === startRundown.id)
					const restRundowns = group.rundowns.slice(startRundownIndex + 1)

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
	}
	return data
}
/**
 * Defines how the rundowns will be played.
 * First there is the array of rundowns that will be played in order.
 * Then there is the repeating array of rundowns that will be played afterwards, and looped.
 */
export interface GroupPreparedPlayheadData {
	/** Timestamp, starting time of the first rundown-to-be-played */
	startTime: number
	/** Total duration of the rundowns in .rundowns. */
	duration: number
	rundowns: {
		/**
		 * The point in time the rundown starts to play. (Starts at 0, relative to GroupPreparedPlayheadData.startTime) */
		startTime: number
		rundown: RundownModel
	}[]

	repeating: {
		duration: number
		rundowns: {
			/** The point in time the rundown starts to play. (Starts at 0, relative to when the repeating starts. ie startTime + duration) */
			startTime: number
			rundown: RundownModel
		}[]
	} | null
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

				if (now >= rundownStartTime && now < rundownStartTime + rundown.rundown.resolved.duration) {
					return {
						rundownId: rundown.rundown.id,
						time: now - rundownStartTime,
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
						time: nowInRepeating - rundown.startTime,
					}
				}
			}
		}
	}

	return null
}
export interface GroupPlayhead {
	rundownId: string
	time: number
}
