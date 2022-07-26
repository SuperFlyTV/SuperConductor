import { Group, GroupBase, PlayoutMode } from '../models/rundown/Group'
import {
	GroupPreparedPlayData,
	GroupPreparedPlayDataMulti,
	GroupPreparedPlayDataPart,
	GroupPreparedPlayDataSection,
	GroupPreparedPlayDataSingle,
	PlayPartEndAction,
} from '../models/GUI/PreparedPlayhead'
import { Part } from '../models/rundown/Part'
import { findPart } from './util'
import { assertNever, literal } from '@shared/lib'
import { repeatTime } from './timeLib'
import _ from 'lodash'

const prepareValidDuration = 365 * 24 * 3600 * 1000
const prepareValidMaxCount = 10

type PlayAction = {
	time: number
	partId: string

	pauseTime?: number
	fromSchedule: boolean
}

/** Calculates how the parts in a group is going to be played
 * @see GroupPreparedPlayheadData
 */
export function prepareGroupPlayData(group: Group): GroupPreparedPlayData | null {
	if (group.disabled) {
		return null
	}
	const now = Date.now()

	if (group.oneAtATime) {
		let validUntil: number | undefined = undefined

		const actions: PlayAction[] = []

		const playingPartId = Object.keys(group.playout.playingParts)[0] as string | undefined
		if (playingPartId) {
			actions.push({
				time: group.playout.playingParts[playingPartId].startTime,
				pauseTime: group.playout.playingParts[playingPartId].pauseTime,
				partId: playingPartId,
				fromSchedule: false,
			})
		}

		if (group.playoutMode === PlayoutMode.SCHEDULE) {
			const firstPlayablePart = getPlayablePartsAfter(group.parts, null)[0]
			if (group.schedule.startTime && firstPlayablePart) {
				// const groupLastInteractionTime = Math.max(0, ...groupStartTimes, groupPausedTime || 0)
				const repeatResult = repeatTime(group.schedule.startTime, group.schedule.repeating, {
					now: now,
					end: now + prepareValidDuration,
					maxCount: prepareValidMaxCount,
				})

				for (const startTime of repeatResult.startTimes) {
					actions.push({
						time: startTime,
						partId: firstPlayablePart.id,
						fromSchedule: true,
					})
				}
				validUntil = repeatResult.validUntil
			}
		}
		// Sort in time ascending:
		actions.sort((a, b) => {
			return a.time - b.time
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
			// let groupStartTime = groupStartTimes[0]
			const data: GroupPreparedPlayDataSingle = {
				type: 'single',
				sections: [],
				validUntil: validUntil,
			}

			let previousSection: GroupPreparedPlayDataSection | undefined = undefined
			for (const action of actions) {
				let actionPart = findPart(group, action.partId)
				if (!actionPart) continue

				if (action.pauseTime !== undefined) {
					// Only play the one part, and pause it at groupPausedTime
					const section: GroupPreparedPlayDataSection = {
						startTime: action.time,
						pauseTime: action.pauseTime,
						endTime: null,
						duration: null,
						parts: [],
						repeating: false,
						schedule: action.fromSchedule,
					}

					const pausedPart: GroupPreparedPlayDataPart = {
						startTime: action.time,
						duration: actionPart.resolved.duration,
						part: actionPart,
					}
					section.parts.push(pausedPart)
					saveSection(data.sections, section)
					// } else if (group.loop && !group.autoPlay) {
					// 	// Only loop the one part
					// 	if (!actionPart.disabled) {
					// 		const section: GroupPreparedPlayDataSection = {
					// 			startTime: action.time,
					// 			pauseTime: undefined,
					// 			endTime: null,
					// 			duration: null,
					// 			parts: [],
					// 			repeating: true,
					// 			schedule: action.fromSchedule,
					// 		}
					// 		// Add the part
					// 		const loopingPart: GroupPreparedPlayDataPart = {
					// 			startTime: action.time,
					// 			// pauseTime: undefined,
					// 			duration: actionPart.resolved.duration,
					// 			part: actionPart,
					// 		}
					// 		section.parts.push(loopingPart)
					// 		saveSection(data.sections, section)
					// 	}
				} else {
					// Add the starting Part:
					const section: GroupPreparedPlayDataSection = {
						startTime: action.time,
						pauseTime: undefined,
						endTime: null,
						duration: null,
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
						let nextStartTime: number = action.time
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
					saveSection(data.sections, section)

					if (group.loop && section.endTime !== null && !endLoopingPart) {
						// Looping parts:

						const loopSection: GroupPreparedPlayDataSection = {
							startTime: section.endTime,
							pauseTime: undefined,
							endTime: null,
							duration: null,
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
							endTime: null,
							duration: null,
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

				// Post process, to handle Looping Part:
				// let foundLooping = false
				// for (let i = 0; i < data.parts.length; i++) {
				// 	const part = data.parts[i]
				// 	if (part.part.loop && !part.part.disabled && part.pauseTime === undefined) {
				// 		// Oh my! The part is looping!
				// 		// discard the rest of the parts, and put this part in repeating:
				// 		data.parts.splice(i, Infinity)

				// 		// Calculate the duration of the remaining parts:
				// 		data.duration = data.parts.reduce((mem: number | null, part) => {
				// 			if (mem === null || part.duration === null) return null
				// 			return mem + part.duration
				// 		}, 0)

				// 		// // Ensure that the previous part endAction is 'next':
				// 		// if (i > 0) data.parts[i - 1].endAction = 'next'
				// 		// if (part.duration === null) {
				// 		// 	part.endAction = 'infinite'
				// 		// } else {
				// 		// 	part.endAction = 'loop'
				// 		// }
				// 		data.repeating = {
				// 			parts: [part],
				// 			duration: part.duration,
				// 		}
				// 		foundLooping = true
				// 		break
				// 	}
				// }
				// // Post process, to handle Looping Part in the repeating section:
				// if (!foundLooping && data.repeating) {
				// 	for (let i = 0; i < data.repeating.parts.length; i++) {
				// 		const part = data.repeating.parts[i]
				// 		if (part.part.loop && !part.part.disabled && part.pauseTime === undefined) {
				// 			// Oh my! The part is looping!
				// 			// This means that we should move over the previous repeating parts to the .parts array,
				// 			// and put this part in repeating:

				// 			const partsToMove = data.repeating.parts.slice(0, i)
				// 			for (const movePart of partsToMove) {
				// 				if (data.duration === null) {
				// 					movePart.endAction = 'infinite'
				// 					break
				// 				}
				// 				movePart.endAction = 'next'
				// 				data.parts.push(movePart)
				// 				if (movePart.duration === null) data.duration = null
				// 				else data.duration += movePart.duration
				// 			}
				// 			if (part.duration === null) {
				// 				part.endAction = 'infinite'
				// 			} else {
				// 				part.endAction = 'loop'
				// 			}
				// 			data.repeating = {
				// 				parts: [part],
				// 				duration: part.duration,
				// 			}
				// 			foundLooping = true
				// 			break
				// 		}
				// 	}
				// }
			}

			return data
		}
	} else {
		// Playing multiple parts at the same time.

		// let playingParts: GroupBase['playout']['playingParts']
		// let repeatTimes: GroupPreparedPlayDataMulti['repeatOffsets']
		let validUntil: number | undefined = undefined

		const actions: { [partId: string]: PlayAction[] } = {}

		for (const [partId, playingPart] of Object.entries(group.playout.playingParts)) {
			if (!actions[partId]) actions[partId] = []
			actions[partId].push({
				partId: partId,
				time: playingPart.startTime,
				pauseTime: playingPart.pauseTime,
				fromSchedule: false,
			})
		}

		if (group.playoutMode === PlayoutMode.SCHEDULE) {
			if (group.schedule.startTime) {
				const repeatResult = repeatTime(group.schedule.startTime, group.schedule.repeating, {
					now: now,
					end: now + prepareValidDuration,
					maxCount: prepareValidMaxCount,
				})
				const playableParts = getPlayablePartsAfter(group.parts, null)
				for (const part of playableParts) {
					if (!actions[part.id]) actions[part.id] = []

					for (const startTime of repeatResult.startTimes) {
						actions[part.id].push({
							time: startTime,
							partId: part.id,
							fromSchedule: true,
						})
					}
					validUntil = repeatResult.validUntil
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
						if (action.pauseTime !== undefined) {
							// The part is paused at pauseTime

							const section: GroupPreparedPlayDataSection = {
								startTime: action.time,
								pauseTime: action.pauseTime,
								endTime: null,
								duration: null,
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
								endTime: null,
								duration: actionPart.resolved.duration,
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
	} else if (section.duration !== null) {
		section.endTime = section.startTime + section.duration
	}

	const prevSection = _.last(sections)
	if (prevSection) {
		// Ensure that the previous section has a correct endTime:
		prevSection.endTime = section.startTime

		const lastPart = _.last(prevSection.parts)
		if (lastPart) {
			if (section.schedule) {
				lastPart.endAction = PlayPartEndAction.SCHEDULE
			} else {
				lastPart.endAction = PlayPartEndAction.NEXT_PART
			}
		}
	}

	sections.push(section)
}

/**
 * Calculates which parts in GroupPreparedPlayheadData is currently on-air, and how far in them we currently are.
 */
export function getGroupPlayData(prepared: GroupPreparedPlayData | null, now = Date.now()): GroupPlayData {
	const playData: GroupPlayData = {
		groupIsPlaying: false,
		groupScheduledToPlay: [],
		anyPartIsPlaying: false,
		allPartsArePaused: true,
		playheads: {},
		countdowns: {},
	}

	if (prepared) {
		if (prepared.type === 'single') {
			let playhead: GroupPlayDataPlayhead | null = null

			for (const section of prepared.sections) {
				playhead = getPlayheadForSection(playData, now, section) || playhead
			}

			if (playhead) {
				playData.groupIsPlaying = true
				playData.anyPartIsPlaying = true
				playData.playheads[playhead.partId] = playhead

				if (playhead.partPauseTime === undefined) playData.allPartsArePaused = false
			}
		} else if (prepared.type === 'multi') {
			for (const [partId, sections] of Object.entries(prepared.sections)) {
				for (const section of sections) {
					const playhead = getPlayheadForSection(playData, now, section)

					if (playhead) {
						playData.anyPartIsPlaying = true
						playData.playheads[partId] = playhead

						if (playhead.partPauseTime === undefined) playData.allPartsArePaused = false
					}
				}
			}
		} else {
			assertNever(prepared)
		}
	}

	if (playData.groupIsPlaying && Object.keys(playData.playheads).length > 1) {
		throw new Error('When groupIsPlaying is set, the length of playheads must be 1!')
	}

	return playData
}
/** Add a coundown until a Part */
function addCountdown(playData: GroupPlayData, part: Part, duration: number) {
	if (duration <= 0) return

	if (!playData.countdowns[part.id]) playData.countdowns[part.id] = []
	playData.countdowns[part.id].push(duration)
}
function getPlayheadForSection(
	playData: GroupPlayData,
	now: number,
	section: GroupPreparedPlayDataSection
): GroupPlayDataPlayhead | null {
	let playhead: GroupPlayDataPlayhead | null = null

	let sectionStartTime = section.startTime

	/** How much to add to times to get the times in the current repetition [ms] */
	let repeatAddition: number = 0

	if (section.repeating && section.duration !== null && now >= section.startTime) {
		// /** When the repeating first starts (unix timestamp) */
		// const repeatingStartTime = sectionStartTime + section.duration

		/** A value that goes from 0 - repeating.duration */
		const nowInRepeating = (now - section.startTime) % (section.duration ?? Infinity)
		/** When the current iteration of the repeating started (unix timestamp) */
		const currentRepeatingStartTime = now - nowInRepeating

		/** How much to add to times to get the times in the current repetition [ms] */
		repeatAddition = Math.max(0, currentRepeatingStartTime - section.startTime)
	}

	sectionStartTime += repeatAddition
	// const sectionEndTime = section.duration === null ? null : sectionStartTime + section.duration
	const nextSectionStartTime = section.duration === null ? null : sectionStartTime + section.duration

	if (section.schedule) {
		if (sectionStartTime > now) playData.groupScheduledToPlay.push(sectionStartTime - now)
		if (nextSectionStartTime !== null && nextSectionStartTime > now)
			playData.groupScheduledToPlay.push(nextSectionStartTime - now)
	}

	// if (now >= sectionStartTime && now < (sectionEndTime || Infinity)) {
	for (const part of section.parts) {
		/** Start time of the part, in this repetition (unix timestamp) */
		const partStartTime = part.startTime + repeatAddition
		/** If set, startTime is disregarded and the part is instead paused at the pauseTime (0 is start of the part) [ms] */
		// const partPauseTime = part.pauseTime
		/** End time of the part (unix timestamp) */
		const partEndTime = part.duration === null ? null : partStartTime + part.duration

		// if (nextScheduleStartTime && partStartTime > nextScheduleStartTime) {
		// 	// The Part won't play, since the group is scheduled to play next time before it starts
		// 	continue
		// }
		// part.
		// const isPaused = section.pauseTime !== undefined
		const playheadTime = section.pauseTime !== undefined ? section.pauseTime : now - partStartTime

		if (section.pauseTime === undefined) {
			if (partStartTime >= section.startTime && partStartTime < (section.endTime ?? Infinity)) {
				addCountdown(playData, part.part, partStartTime - now)
			}

			if (section.repeating && section.duration !== null) {
				// Also add for the next repeating loop:
				const nextPartStartTime = partStartTime + section.duration
				if (nextPartStartTime >= section.startTime && nextPartStartTime < (section.endTime ?? Infinity)) {
					addCountdown(playData, part.part, nextPartStartTime - now)
				}
			}
		}
		// if (part.endAction === 'loop' && prepared.repeating.duration !== null) {
		// 	// Also add for the next repeating loop:
		// 	addCountdown(playData, part.part, timeUntilPart + prepared.repeating.duration)
		// }

		// if (isPaused || (now >= partStartTime && (partEndTime === null || now < partEndTime))) {
		if (playheadTime >= 0 && playheadTime < (part.duration || Infinity)) {
			playhead = literal<GroupPlayDataPlayhead>({
				playheadTime: playheadTime,
				partStartTime: partStartTime,
				partPauseTime: section.pauseTime,
				partEndTime: partEndTime,
				partDuration: part.duration,
				partId: part.part.id,
				isInRepeating: true,
				endAction: part.endAction,
			})
		}
	}
	// }
	return playhead
}
export interface GroupPlayData {
	/** If the Group is playing (this is always false if one-at-a-time is set) */
	groupIsPlaying: boolean
	/** If the group is scheduled to play in the future, this contains the time until it'll play [ms] */
	groupScheduledToPlay: number[]
	/** If any part in the group is playing */
	anyPartIsPlaying: boolean
	/** If all parts in the group are playing, and paused */
	allPartsArePaused: boolean

	/** Map of the playhead(s) */
	playheads: {
		[partId: string]: GroupPlayDataPlayhead
	}

	/** Time(s) until parts will start playing: */
	countdowns: { [partId: string]: number[] }
}
export interface GroupPlayDataPlayhead {
	/** The current time of the playhead (ie time since the part started) [ms] */
	playheadTime: number
	/** The time when the part started playing (unix time) */
	partStartTime: number
	/** If set, the playhead is paused, startTime is disregarded and the part is instead paused at the pauseTime (0 is start of the part) [ms] */
	partPauseTime: number | undefined
	/** The end time of the part the playhead is in (unix time), null = infinity*/
	partEndTime: number | null
	/** Duration of the part [ms], null = infinity*/
	partDuration: number | null
	/** Id of the Part the playead refers to */
	partId: string
	/** What the playhead will to when it reaches the partEndTime */
	endAction: PlayPartEndAction | undefined

	/** Whether the playhead has entered the repeating section of parts */
	isInRepeating: boolean
}
