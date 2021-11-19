import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
import { findRundown } from './util'

export interface GroupPreparedPlayheadData {
	/** timestamp, starting time of group */
	startTime: number
	duration: number
	rundowns: {
		/** starts at 0 */
		startTime: number
		duration: number
		rundownId: string
	}[]

	repeating: {
		duration: number
		rundowns: {
			/** starts at 0 */
			startTime: number
			duration: number
			rundownId: string
		}[]
	} | null
}
export function prepareGroupPlayhead(group: GroupModel): GroupPreparedPlayheadData | null {
	const data: GroupPreparedPlayheadData = {
		startTime: 0,
		duration: 0,
		rundowns: [],
		repeating: null,
	}

	if (group.playing) {
		data.startTime = group.playing.startTime

		let startTime = 0
		const startRundown = findRundown(group, group.playing.startRundownId)
		if (startRundown) {
			data.rundowns.push({
				startTime: startTime,
				duration: startRundown.resolved.duration,
				rundownId: startRundown.id,
			})
			startTime += startRundown.resolved.duration

			if (group.autoPlay) {
				// Add the rest of the rundowns in the group to the timeline:
				const startRundownIndex = group.rundowns.findIndex((r) => r.id === startRundown.id)
				const restRundowns = group.rundowns.slice(startRundownIndex + 1)

				for (const rundown of restRundowns) {
					data.rundowns.push({
						startTime: startTime,
						duration: rundown.resolved.duration,
						rundownId: rundown.id,
					})
					startTime += rundown.resolved.duration
				}
			}
			data.duration = startTime

			if (group.loop) {
				data.repeating = {
					duration: 0,
					rundowns: [],
				}

				let startTime = 0
				for (const rundown of group.rundowns) {
					data.repeating.rundowns.push({
						startTime: startTime,
						duration: rundown.resolved.duration,
						rundownId: rundown.id,
					})
					startTime += rundown.resolved.duration
				}
				data.repeating.duration = startTime
			}
		}
	}
	return data
}
export interface GroupPlayhead {
	rundownId: string
	time: number
}
export function getGroupPlayhead(data: GroupPreparedPlayheadData | null): GroupPlayhead | null {
	if (data) {
		const now = Date.now()

		if (now >= data.startTime && now < data.startTime + data.duration) {
			for (const rundown of data.rundowns) {
				const rundownStartTime = data.startTime + rundown.startTime

				if (now >= rundownStartTime && now < rundownStartTime + rundown.duration) {
					return {
						rundownId: rundown.rundownId,
						time: now - rundownStartTime,
					}
				}
			}
		} else if (data.repeating && now >= data.startTime + data.duration) {
			// In the repeating section

			const repeatingStartTime = data.startTime + data.duration
			const nowInRepeating = (now - repeatingStartTime) % data.repeating.duration

			for (const rundown of data.repeating.rundowns) {
				const rundownEndTime = rundown.startTime + rundown.duration
				if (nowInRepeating >= rundown.startTime && nowInRepeating < rundownEndTime) {
					return {
						rundownId: rundown.rundownId,
						time: nowInRepeating - rundown.startTime,
					}
				}
			}
		}
	}

	return null
}
