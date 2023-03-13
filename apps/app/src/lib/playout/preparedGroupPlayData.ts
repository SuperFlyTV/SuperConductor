import { Group, PlayoutMode } from '../../models/rundown/Group'
import {
	GroupPreparedPlayData,
	GroupPreparedPlayDataMulti,
	GroupPreparedPlayDataPart,
	GroupPreparedPlayDataSection,
	GroupPreparedPlayDataSingle,
	PlayPartEndAction,
	SectionEndAction,
} from '../../models/GUI/PreparedPlayhead'
import { Part } from '../../models/rundown/Part'
import { findPart } from '../util'
import { repeatTime } from '../timeLib'
import _ from 'lodash'

/******************************************************************************
 *
 * The Prepared Group PlayData is a dataset that is generated upon a user action.
 * It contains calculated information about what is going to be played, and when.
 *
 *****************************************************************************/

const prepareValidDuration = 365 * 24 * 3600 * 1000
const prepareValidMaxCount = 100

type PlayAction = {
	time: number
	partId: string

	stopTime?: number

	pauseTime?: number
	fromSchedule: boolean
}

/** Calculates how the parts in a group is going to be played
 * @see GroupPreparedPlayheadData
 */
export function prepareGroupPlayData(group: Group, now?: number): GroupPreparedPlayData | null {
	if (group.disabled) {
		return null
	}
	if (!now) now = Date.now()

	if (group.oneAtATime) {
		let validUntil: number | undefined = undefined

		const actions: PlayAction[] = []

		let lastStopTime: number | undefined = undefined

		const playingPartEntry = Object.entries(group.playout.playingParts)[0] // in oneAtATime mode, there is only one playing part
		if (playingPartEntry) {
			const [playingPartId, playingPart] = playingPartEntry

			if (!playingPart.fromSchedule) {
				actions.push({
					time: playingPart.startTime,
					pauseTime: playingPart.pauseTime,
					stopTime: playingPart.stopTime,
					partId: playingPartId,
					fromSchedule: false,
				})
			}
			if (playingPart.stopTime) lastStopTime = playingPart.stopTime
		}

		if (group.playoutMode === PlayoutMode.SCHEDULE) {
			const firstPlayablePart = getPlayablePartsAfter(group.parts, null)[0]
			if (group.schedule.startTime && group.schedule.activate && firstPlayablePart) {
				const repeatResult = repeatTime(group.schedule.startTime, group.schedule.repeating, {
					now: now,
					end: now + prepareValidDuration,
					maxCount: prepareValidMaxCount,
				})

				for (const startTime of repeatResult.startTimes) {
					if (startTime >= (lastStopTime ?? 0)) {
						actions.push({
							time: startTime,
							partId: firstPlayablePart.id,
							fromSchedule: true,
						})
					}
				}
				validUntil = repeatResult.validUntil
			}
		}
		// Sort in time ascending:
		actions.sort((a, b) => {
			return a.time + (a.pauseTime ?? 0) - (b.time + (b.pauseTime ?? 0))
		})
		// If there are more than one in the past, remove older ones:
		for (let i = 1; i < actions.length; i++) {
			if (actions[i].time <= now) {
				actions.splice(i - 1, 1)
				i--
			}
		}

		// Is playing at all?
		if (actions.length > 0) {
			const data: GroupPreparedPlayDataSingle = {
				type: 'single',
				sections: [],
				validUntil: validUntil,
			}

			for (const action of actions) {
				let actionPart = findPart(group, action.partId)
				if (!actionPart) continue

				if (action.stopTime && action.stopTime < action.time) continue

				// Add the starting Part:
				const section: GroupPreparedPlayDataSection = {
					startTime: action.time,
					pauseTime: undefined,
					stopTime: action.stopTime,
					endTime: null, // calculated later
					duration: null, // calculated later
					endAction: SectionEndAction.INFINITE, // calculated later
					parts: [],
					repeating: false,
					schedule: action.fromSchedule,
				}

				// Special case: If the first part is disabled:
				if (actionPart.disabled) {
					// The currently playing part is disabled.

					if (group.autoPlay) {
						// Go to next playable part:
						let restParts = getPlayablePartsAfter(group.parts, actionPart.id)
						if (restParts.length === 0) {
							if (group.loop) {
								restParts = getPlayablePartsAfter(group.parts, null)
							}
						}
						if (restParts.length > 0) {
							actionPart = restParts[0]
							section.startTime = now
						} else {
							actionPart = undefined
						}
					} else {
						// Stop playing:
						actionPart = undefined
					}
				}
				if (!actionPart) continue

				let endLoopingPart: Part | undefined = undefined
				const partsToPlay: Part[] = [actionPart]

				if (group.autoPlay) {
					// Add the rest of the Parts in the group:
					const restParts = getPlayablePartsAfter(group.parts, actionPart.id)

					partsToPlay.push(...restParts)
				}
				{
					let nextStartTime: number = section.startTime
					for (const part of partsToPlay) {
						if (part.loop) {
							endLoopingPart = part
							break
						}

						// Add the part:
						const playPart: GroupPreparedPlayDataPart = {
							startTime: nextStartTime,
							duration: part.resolved.duration,
							part: part,
						}
						section.parts.push(playPart)

						if (playPart.duration === null) {
							// Infinite
							break
						} else {
							nextStartTime += playPart.duration
						}
					}
				}
				// Modify if paused:

				if (action.pauseTime !== undefined) {
					// Pause it at groupPausedTime
					section.pauseTime = action.pauseTime
					if (group.loop) section.repeating = true
				}

				saveSection(data.sections, section)

				if (group.loop && section.endTime !== null && !endLoopingPart) {
					// Looping parts:

					const loopSection: GroupPreparedPlayDataSection = {
						startTime: section.endTime,
						pauseTime: undefined,
						stopTime: action.stopTime,
						endTime: null, // calculated later
						duration: null, // calculated later
						endAction: SectionEndAction.INFINITE, // calculated later
						parts: [],
						repeating: true,
						schedule: false, // Set to false, since this follows a scheduled(?) section
					}

					let nextStartTime: number = loopSection.startTime

					const playableParts = getPlayablePartsAfter(group.parts, null)
					for (const part of playableParts) {
						if (part.loop) {
							endLoopingPart = part
							section.repeating = false
							break
						}

						// Add the part:
						const playPart: GroupPreparedPlayDataPart = {
							startTime: nextStartTime,
							duration: part.resolved.duration,
							part: part,
						}
						loopSection.parts.push(playPart)

						if (part.resolved.duration !== null) {
							nextStartTime += part.resolved.duration
						} else {
							// Infinite
							break
						}
					}
					saveSection(data.sections, loopSection)
				}

				// Handle the case when a part is looping:
				const lastSection = _.last(data.sections)
				if (endLoopingPart && lastSection && lastSection.endTime) {
					const loopPartSection: GroupPreparedPlayDataSection = {
						startTime: lastSection.endTime,
						pauseTime: undefined,
						stopTime: action.stopTime,
						endTime: null, // calculated later
						duration: null, // calculated later
						endAction: SectionEndAction.INFINITE, // calculated later
						parts: [],
						repeating: true,
						schedule: false, // Set to false, since this follows a scheduled(?) section
					}
					const playPart: GroupPreparedPlayDataPart = {
						startTime: loopPartSection.startTime,
						duration: endLoopingPart.resolved.duration,
						part: endLoopingPart,
					}
					loopPartSection.parts.push(playPart)
					saveSection(data.sections, loopPartSection)
				}
			}
			return data
		}
	} else {
		// Playing multiple parts at the same time.

		let validUntil: number | undefined = undefined

		const actions: { [partId: string]: PlayAction[] } = {}
		const lastStopTime: { [partId: string]: number } = {}

		for (const [partId, playingPart] of Object.entries(group.playout.playingParts)) {
			if (!actions[partId]) actions[partId] = []
			if (!playingPart.fromSchedule) {
				actions[partId].push({
					time: playingPart.startTime,
					pauseTime: playingPart.pauseTime,
					stopTime: playingPart.stopTime,
					partId: partId,
					fromSchedule: false,
				})
			}

			if (playingPart.stopTime) lastStopTime[partId] = playingPart.stopTime
		}

		if (group.playoutMode === PlayoutMode.SCHEDULE) {
			if (group.schedule.startTime && group.schedule.activate) {
				const repeatResult = repeatTime(group.schedule.startTime, group.schedule.repeating, {
					now: now,
					end: now + prepareValidDuration,
					maxCount: prepareValidMaxCount,
				})
				const playableParts = getPlayablePartsAfter(group.parts, null)
				for (const part of playableParts) {
					if (!actions[part.id]) actions[part.id] = []

					for (const startTime of repeatResult.startTimes) {
						if (startTime >= (lastStopTime[part.id] ?? 0)) {
							actions[part.id].push({
								time: startTime,
								partId: part.id,
								fromSchedule: true,
							})
						}
					}
					validUntil = repeatResult.validUntil
				}
			}
		}

		for (const actionsForPart of Object.values(actions)) {
			// Sort in time ascending:
			actionsForPart.sort((a, b) => {
				return a.time + (a.pauseTime ?? 0) - (b.time + (b.pauseTime ?? 0))
			})
			// If there are more than one in the past, remove older ones:
			for (let i = 1; i < actionsForPart.length; i++) {
				if (actionsForPart[i].time <= now) {
					actionsForPart.splice(i - 1, 1)
					i--
				}
			}
		}

		// Is anything playing?
		if (Object.keys(actions).length > 0) {
			const data: GroupPreparedPlayDataMulti = {
				type: 'multi',
				sections: {},
				validUntil: validUntil,
			}

			for (const [partId, partActions] of Object.entries(actions)) {
				const partSections: GroupPreparedPlayDataSection[] = []

				const actionPart = findPart(group, partId)
				if (actionPart && !actionPart.disabled) {
					for (const action of partActions) {
						if (action.stopTime && action.stopTime < action.time) continue

						if (action.pauseTime !== undefined) {
							// The part is paused at pauseTime

							const section: GroupPreparedPlayDataSection = {
								startTime: action.time,
								pauseTime: action.pauseTime,
								stopTime: action.stopTime,
								endTime: null, // calculated later
								duration: null, // calculated later
								endAction: SectionEndAction.INFINITE, // calculated later
								parts: [],
								repeating: false,
								schedule: action.fromSchedule,
							}
							const part: GroupPreparedPlayDataPart = {
								startTime: action.time,
								duration: actionPart.resolved.duration,
								part: actionPart,
							}
							section.parts.push(part)
							saveSection(partSections, section)
						} else {
							const section: GroupPreparedPlayDataSection = {
								startTime: action.time,
								pauseTime: undefined,
								stopTime: action.stopTime,
								endTime: null, // calculated later
								duration: actionPart.resolved.duration,
								endAction: SectionEndAction.STOP,
								parts: [],
								repeating: actionPart.loop,
								schedule: action.fromSchedule,
							}
							const part: GroupPreparedPlayDataPart = {
								startTime: action.time,
								duration: actionPart.resolved.duration,
								part: actionPart,
							}
							section.parts.push(part)
							saveSection(partSections, section)
						}
					}
				}

				if (partSections.length > 0) {
					data.sections[partId] = partSections
				}
			}

			return data
		}
	}

	return null
}

function getPlayablePartsAfter(allParts: Part[], currentPartId: string | null): Part[] {
	const restParts: Part[] = []

	let foundCurrentPart = false
	if (currentPartId === null) foundCurrentPart = true // Return all playable parts

	for (const part of allParts) {
		if (foundCurrentPart) {
			if (part.disabled) continue
			restParts.push(part)
		} else {
			if (part.id === currentPartId) foundCurrentPart = true
		}
	}
	return restParts
}
/** Post-process section and add it to the list */
function saveSection(sections: GroupPreparedPlayDataSection[], section: GroupPreparedPlayDataSection): void {
	section.duration = 0
	for (let i = 0; i < section.parts.length; i++) {
		const prevPart = i > 0 ? section.parts[i - 1] : undefined
		const part = section.parts[i]

		if (section.duration !== null) {
			if (part.duration !== null) {
				section.duration += part.duration
			} else {
				section.duration = null
			}
		}
		part.endAction = part.duration === null ? PlayPartEndAction.INFINITE : PlayPartEndAction.STOP

		if (prevPart) {
			prevPart.endAction = PlayPartEndAction.NEXT_PART
		}
	}

	if (section.parts.length === 1 && section.parts[0].part.loop) {
		section.parts[0].endAction = PlayPartEndAction.LOOP_SELF
	}

	if (section.pauseTime !== undefined || section.repeating) {
		section.endTime = null
		section.endAction = section.repeating ? SectionEndAction.LOOP_SELF : SectionEndAction.INFINITE
	} else if (section.duration !== null) {
		section.endTime = section.startTime + section.duration
		section.endAction = SectionEndAction.STOP
	}

	if (section.stopTime && (!section.endTime || section.endTime > section.stopTime)) {
		section.endTime = section.stopTime
		section.endAction = SectionEndAction.STOP
	}

	const prevSection = _.last(sections)
	if (prevSection) {
		// Ensure that the previous section has a correct endTime:
		if (!prevSection.endTime || prevSection.endTime > section.startTime) {
			prevSection.endTime = section.startTime
		}
		prevSection.endAction = SectionEndAction.NEXT_SECTION

		const lastPart = _.last(prevSection.parts)
		if (lastPart) {
			if (prevSection.endTime === section.startTime) {
				if (section.schedule) {
					lastPart.endAction = PlayPartEndAction.SCHEDULE
				} else {
					lastPart.endAction = PlayPartEndAction.NEXT_PART
				}
			} else if (prevSection.endTime) {
				lastPart.endAction = PlayPartEndAction.STOP
			}
		}
	}

	sections.push(section)
}
