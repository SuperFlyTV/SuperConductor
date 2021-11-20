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
}
