import { Group } from '../models/rundown/Group'
import { GroupPreparedPlayheadData } from '../models/GUI/PreparedPlayhead'
import { Part } from '../models/rundown/Part'
import { last } from '@shared/lib'
import { findPart } from './util'

/** Calculates how the parts in a group is going to be played
 * @see GroupPreparedPlayheadData
 */
export function prepareGroupPlayhead(group: Group): GroupPreparedPlayheadData | null {
	if (group.playout.startTime && group.playout.partIds.length) {
		const data: GroupPreparedPlayheadData = {
			startTime: 0,
			duration: 0,
			parts: [],
			repeating: null,
		}
		data.startTime = group.playout.startTime

		// const startPart = findPart(group, group.playout.startPartId)
		// if (startPart) {

		// let currentPart: PartModel = startPart

		const queuedParts: Part[] = []
		for (const partId of group.playout.partIds) {
			const part = findPart(group, partId)
			if (part) queuedParts.push(part)
		}

		if (group.loop && !group.autoPlay) {
			// Only loop the one part (or well, the queued parts)

			// Add the rudown into .repeating instead, to make it loop:
			data.parts = []
			data.duration = 0 // Becase .parts is empty
			data.repeating = {
				duration: 0, // set later
				parts: [],
			}

			let nextStartTime = 0
			// Add the queued Parts:
			for (const part of queuedParts) {
				data.repeating.parts.push({
					startTime: nextStartTime,
					part,
				})
				nextStartTime += part.resolved.duration
			}
			data.repeating.duration = nextStartTime
		} else {
			/** The startTime of the next Part. */
			let nextStartTime = 0

			// Add the starting Part:
			// data.parts.push({
			// 	startTime: nextStartTime,
			// 	part: startPart,
			// })
			// let currentPart: PartModel = startPart
			// nextStartTime += startPart.resolved.duration
			// data.duration = nextStartTime // Note: This might be overwritten later..

			// Add the queued Parts:
			for (const part of queuedParts) {
				data.parts.push({
					startTime: nextStartTime,
					part,
				})
				nextStartTime += part.resolved.duration
			}
			data.duration = nextStartTime // Note: This might be overwritten later.
			const lastQueuedPart: Part = last(queuedParts) as Part

			if (group.autoPlay) {
				// Add the rest of the Parts in the group:
				const currentPartIndex = group.parts.findIndex((r) => r.id === lastQueuedPart.id)
				const restParts = group.parts.slice(currentPartIndex + 1)

				for (const part of restParts) {
					data.parts.push({
						startTime: nextStartTime,
						part: part,
					})
					nextStartTime += part.resolved.duration
				}
				data.duration = nextStartTime

				// Looping parts:
				if (group.loop) {
					data.repeating = {
						duration: 0,
						parts: [],
					}

					let startTime = 0
					for (const part of group.parts) {
						data.repeating.parts.push({
							startTime: startTime,
							part: part,
						})
						startTime += part.resolved.duration
					}
					data.repeating.duration = startTime
				}
			}
		}
		// }
		return data
	}
	return null
}

/**
 * Calculates which part in GroupPreparedPlayheadData is currently on-air, and how far in it we currently are.
 */
export function getGroupPlayhead(data: GroupPreparedPlayheadData | null): GroupPlayhead | null {
	if (data) {
		const now = Date.now()

		const playhead: GroupPlayhead = {
			partId: '',
			playheadTime: 0,
			partEndTime: 0,
			isInRepeating: false,
			timeUntilParts: {},
		}
		const addTimeUntilPart = (part: Part, time: number) => {
			if (time < 0) return

			if (!playhead.timeUntilParts[part.id]) playhead.timeUntilParts[part.id] = []
			playhead.timeUntilParts[part.id].push(time)
		}

		if (now >= data.startTime && now < data.startTime + data.duration) {
			for (const part of data.parts) {
				const partStartTime = data.startTime + part.startTime
				const partEndTime = partStartTime + part.part.resolved.duration

				addTimeUntilPart(part.part, partStartTime - now)

				if (now >= partStartTime && now < partEndTime) {
					playhead.partId = part.part.id
					playhead.playheadTime = now - partStartTime
					playhead.partEndTime = part.part.resolved.duration
					playhead.isInRepeating = false
				}
			}
		}

		if (data.repeating) {
			// now >= data.startTime + data.duration
			// In the repeating section

			const repeatingStartTime = data.startTime + data.duration
			const nowInRepeating = (now - repeatingStartTime) % data.repeating.duration

			for (const part of data.repeating.parts) {
				const partEndTime = part.startTime + part.part.resolved.duration

				const timeUntilPart = part.startTime - nowInRepeating
				addTimeUntilPart(part.part, timeUntilPart)
				addTimeUntilPart(part.part, timeUntilPart + data.repeating.duration) // Also add for the next loop

				if (nowInRepeating >= part.startTime && nowInRepeating < partEndTime) {
					playhead.partId = part.part.id
					playhead.playheadTime = nowInRepeating - part.startTime
					playhead.partEndTime = part.part.resolved.duration
					playhead.isInRepeating = true
				}
			}
		}
		return playhead
	}

	return null
}
export interface GroupPlayhead {
	partId: string
	playheadTime: number
	partEndTime: number

	/** Whether the playhead has entered the repeating part of parts */
	isInRepeating: boolean

	timeUntilParts: { [partId: string]: number[] }
}
