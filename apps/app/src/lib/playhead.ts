import { Group } from '../models/rundown/Group'
import {
	GroupPreparedPlayData,
	GroupPreparedPlayDataMulti,
	GroupPreparedPlayDataPart,
	GroupPreparedPlayDataSingle,
} from '../models/GUI/PreparedPlayhead'
import { Part } from '../models/rundown/Part'
import { findPart } from './util'
import { assertNever } from '@shared/lib'

/** Calculates how the parts in a group is going to be played
 * @see GroupPreparedPlayheadData
 */
export function prepareGroupPlayData(group: Group): GroupPreparedPlayData | null {
	if (group.disabled) {
		return null
	}

	if (group.oneAtATime) {
		const playingPartId = Object.keys(group.playout.playingParts)[0]
		let groupStartTime = playingPartId ? group.playout.playingParts[playingPartId].startTime : null
		const groupPausedTime = playingPartId ? group.playout.playingParts[playingPartId].pauseTime : undefined

		// Is playing?
		if (groupStartTime && playingPartId) {
			const data: GroupPreparedPlayDataSingle = {
				type: 'single',
				startTime: 0,
				pauseTime: undefined,
				duration: 0,
				parts: [],
				repeating: null,
			}
			data.startTime = groupStartTime

			let firstPart = findPart(group, playingPartId)
			if (!firstPart) return null

			if (groupPausedTime !== undefined) {
				// Only play the one part, and pause it at groupPausedTime
				data.pauseTime = groupPausedTime
				data.duration = null // infinite

				const pausedPart: GroupPreparedPlayDataPart = {
					startTime: groupStartTime,
					pauseTime: groupPausedTime,
					duration: firstPart.resolved.duration,
					part: firstPart,
					endAction: 'infinite',
				}

				data.parts.push(pausedPart)
			} else if (group.loop && !group.autoPlay) {
				// Only loop the one part

				// Add the rudown into .repeating instead, to make it loop:
				data.parts = []
				data.duration = 0 // Becase .parts is empty
				data.repeating = {
					duration: 0, // set later
					parts: [],
				}

				let nextStartTime: number | null = groupStartTime

				if (!firstPart.disabled) {
					// Add the part
					const loopingPart: GroupPreparedPlayDataPart = {
						startTime: nextStartTime,
						pauseTime: undefined,
						duration: firstPart.resolved.duration,
						part: firstPart,
						endAction: 'loop',
					}
					data.repeating.parts.push(loopingPart)
					if (firstPart.resolved.duration === null) {
						nextStartTime = null
						loopingPart.endAction = 'infinite'
					} else nextStartTime += firstPart.resolved.duration

					data.repeating.duration = firstPart.resolved.duration
				}
			} else {
				// Add the starting Part:
				if (firstPart.disabled) {
					// The currently playing part is disabled.

					if (group.autoPlay) {
						// Go to next playable part:
						let restParts = getPlayablePartsAfter(group.parts, firstPart.id)
						if (restParts.length === 0) {
							if (group.loop) {
								restParts = getPlayablePartsAfter(group.parts, null)
							}
						}
						if (restParts.length > 0) {
							firstPart = restParts[0]
							groupStartTime = Date.now()
						} else {
							firstPart = undefined
						}
					} else {
						// Stop playing:
						firstPart = undefined
					}
				}

				if (!firstPart) return null

				/** The startTime of the next Part. */
				let nextStartTime: number | null = groupStartTime

				let prevPart: GroupPreparedPlayDataSingle['parts'][0] = {
					startTime: nextStartTime,
					pauseTime: undefined,
					duration: firstPart.resolved.duration,
					part: firstPart,
					endAction: 'stop', // Changed later
				}
				data.parts.push(prevPart)

				if (firstPart.resolved.duration === null) {
					// Infinite
					nextStartTime = null
					data.duration = null
					prevPart.endAction = 'infinite'
				} else {
					nextStartTime += firstPart.resolved.duration
					data.duration = nextStartTime - groupStartTime // Note: This might be overwritten later.
				}

				if (group.autoPlay) {
					// Add the rest of the Parts in the group:
					const restParts = getPlayablePartsAfter(group.parts, firstPart.id)

					for (const part of restParts) {
						if (nextStartTime === null) break

						// Change the previous part:
						prevPart.endAction = 'next'

						// Add the part:
						prevPart = {
							startTime: nextStartTime,
							pauseTime: undefined,
							duration: part.resolved.duration,
							part: part,
							endAction: 'stop', // Changed later
						}
						data.parts.push(prevPart)

						if (part.resolved.duration === null) {
							// Infinite
							nextStartTime = null
							prevPart.endAction = 'infinite'
						} else {
							nextStartTime += part.resolved.duration
						}
					}
					if (nextStartTime === null) {
						// Infinite
						data.duration = null
					} else {
						data.duration = nextStartTime - groupStartTime
					}

					// Looping parts:
					if (group.loop) {
						data.repeating = {
							duration: 0,
							parts: [],
						}

						let repeatingDuration: number | null = 0
						for (const part of group.parts) {
							if (nextStartTime === null) break
							if (repeatingDuration === null) break
							if (part.disabled) continue
							// Change the previous part:
							prevPart.endAction = 'next'
							// Add the part:
							prevPart = {
								startTime: nextStartTime,
								pauseTime: undefined,
								duration: part.resolved.duration,
								part: part,
								endAction: 'next',
							}
							data.repeating.parts.push(prevPart)

							if (part.resolved.duration === null) {
								// Infinite
								nextStartTime = null
								repeatingDuration = null
								prevPart.endAction = 'infinite'
							} else {
								nextStartTime += part.resolved.duration
								repeatingDuration += part.resolved.duration
							}
						}
						data.repeating.duration = repeatingDuration
					}
				}
			}

			// Post process, to handle Looping Part:
			let foundLooping = false
			for (let i = 0; i < data.parts.length; i++) {
				const part = data.parts[i]
				if (part.part.loop && !part.part.disabled && part.pauseTime === undefined) {
					// Oh my! The part is looping!
					// discard the rest of the parts, and put this part in repeating:
					data.parts.splice(i, Infinity)

					// Calculate the duration of the remaining parts:
					data.duration = data.parts.reduce((mem: number | null, part) => {
						if (mem === null || part.duration === null) return null
						return mem + part.duration
					}, 0)

					// Ensure that the previous part endAction is 'next':
					if (i > 0) data.parts[i - 1].endAction = 'next'
					if (part.duration === null) {
						part.endAction = 'infinite'
					} else {
						part.endAction = 'loop'
					}
					data.repeating = {
						parts: [part],
						duration: part.duration,
					}
					foundLooping = true
					break
				}
			}
			// Post process, to handle Looping Part in the repeating section:
			if (!foundLooping && data.repeating) {
				for (let i = 0; i < data.repeating.parts.length; i++) {
					const part = data.repeating.parts[i]
					if (part.part.loop && !part.part.disabled && part.pauseTime === undefined) {
						// Oh my! The part is looping!
						// This means that we should move over the previous repeating parts to the .parts array,
						// and put this part in repeating:

						const partsToMove = data.repeating.parts.slice(0, i)
						for (const movePart of partsToMove) {
							if (data.duration === null) {
								movePart.endAction = 'infinite'
								break
							}
							movePart.endAction = 'next'
							data.parts.push(movePart)
							if (movePart.duration === null) data.duration = null
							else data.duration += movePart.duration
						}
						if (part.duration === null) {
							part.endAction = 'infinite'
						} else {
							part.endAction = 'loop'
						}
						data.repeating = {
							parts: [part],
							duration: part.duration,
						}
						foundLooping = true
						break
					}
				}
			}

			return data
		}
	} else {
		// Playing multiple parts at the same time.

		const partIds = Object.keys(group.playout.playingParts)
		// Is playing?
		if (partIds.length > 0) {
			const data: GroupPreparedPlayDataMulti = {
				type: 'multi',
				parts: {},
			}

			for (const playingPartId of partIds) {
				const playingPart = group.playout.playingParts[playingPartId]

				const part = findPart(group, playingPartId)
				if (part && !part.disabled) {
					if (playingPart.pauseTime !== undefined) {
						// The part is paused at pauseTime
						data.parts[playingPartId] = {
							startTime: playingPart.startTime,
							pauseTime: playingPart.pauseTime,
							duration: part.resolved.duration,
							part,
							endAction: 'infinite',
						}
					} else {
						// The part is playing
						data.parts[playingPartId] = {
							startTime: playingPart.startTime,
							pauseTime: undefined,
							duration: part.resolved.duration,
							part,
							endAction: part.resolved.duration === null ? 'infinite' : part.loop ? 'loop' : 'stop',
						}
					}
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

/**
 * Calculates which parts in GroupPreparedPlayheadData is currently on-air, and how far in it we currently are.
 */
export function getGroupPlayData(prepared: GroupPreparedPlayData | null, now = Date.now()): GroupPlayData {
	const playData: GroupPlayData = {
		groupIsPlaying: false,
		anyPartIsPlaying: false,
		allPartsArePaused: true,
		playheads: {},
		countdowns: {},
	}

	if (prepared) {
		if (prepared.type === 'single') {
			let playheadPartId: string | null = null
			let playhead: GroupPlayDataPlayhead | null = null

			if (
				now >= prepared.startTime &&
				(prepared.duration === null || now < prepared.startTime + prepared.duration)
			) {
				for (const part of prepared.parts) {
					const partPauseTime = part.pauseTime
					const partStartTime = part.startTime
					const partEndTime = part.duration === null ? null : partStartTime + part.duration

					const isPaused = partPauseTime !== undefined
					const playheadTime = isPaused ? partPauseTime : now - partStartTime
					const timeUntilPart = isPaused ? 0 : partStartTime - now

					addCountdown(playData, part.part, timeUntilPart)

					if (isPaused || (now >= partStartTime && (partEndTime === null || now < partEndTime))) {
						playheadPartId = part.part.id
						playhead = {
							playheadTime: playheadTime,
							partStartTime: partStartTime,
							partPauseTime: partPauseTime,
							partEndTime: partEndTime,
							partDuration: part.duration,
							isInRepeating: false,
							endAction: part.endAction,
						}
					}
				}
			}

			if (prepared.repeating && prepared.duration !== null) {
				// Is in the repeating section

				/** When the repeating first starts (unix timestamp) */
				const repeatingStartTime = prepared.startTime + prepared.duration
				/** A value that goes from 0 - repeating.duration */
				const nowInRepeating = (now - repeatingStartTime) % (prepared.repeating.duration ?? Infinity)
				/** When the current iteration of the repeating started (unix timestamp) */
				const currentRepeatingStartTime = now - nowInRepeating
				/** When the next iteration of the repeating wll start (unix timestamp) */
				// const nextRepeatingStartTime = currentRepeatingStartTime + prepared.repeating.duration
				/** How much to add to times to get the times in the current repetition [ms] */
				const repeatAddition = Math.max(0, currentRepeatingStartTime - repeatingStartTime)

				for (const part of prepared.repeating.parts) {
					/** Start time of the part, in this repetition (unix timestamp) */
					const partStartTime = part.startTime + repeatAddition
					/** If set, startTime is disregarded and the part is instead paused at the pauseTime (0 is start of the part) [ms] */
					const partPauseTime = part.pauseTime
					/** End time of the part (unix timestamp) */
					const partEndTime = part.duration === null ? null : partStartTime + part.duration

					const isPaused = partPauseTime !== undefined
					const playheadTime = isPaused ? partPauseTime : now - partStartTime

					const timeUntilPart = isPaused ? 0 : partStartTime - now
					addCountdown(playData, part.part, timeUntilPart)
					if (part.endAction === 'loop' && prepared.repeating.duration !== null) {
						// Also add for the next repeating loop:
						addCountdown(playData, part.part, timeUntilPart + prepared.repeating.duration)
					}

					if (isPaused || (now >= partStartTime && (partEndTime === null || now < partEndTime))) {
						playheadPartId = part.part.id
						playhead = {
							playheadTime: playheadTime,
							partStartTime: partStartTime,
							partPauseTime: partPauseTime,
							partEndTime: partEndTime,
							partDuration: part.duration,
							isInRepeating: true,
							endAction: part.endAction,
						}
					}
				}
			}

			if (playheadPartId && playhead) {
				playData.groupIsPlaying = true
				playData.anyPartIsPlaying = true
				playData.playheads[playheadPartId] = playhead

				if (playhead.partPauseTime === undefined) playData.allPartsArePaused = false
			}
		} else if (prepared.type === 'multi') {
			for (const [playingPartId, playingPart] of Object.entries(prepared.parts)) {
				/** When the part first starts (unix timestamp) */
				const firstPartStartTime = playingPart.startTime

				const partPauseTime = playingPart.pauseTime

				/** How much to add to times to get the times in the current repetition [ms] */
				let repeatAddition: number

				if (playingPart.endAction === 'loop') {
					/** A value that goes from 0 -  playingPart.duration */
					const nowInRepeating = (now - firstPartStartTime) % (playingPart.duration ?? Infinity)

					/** When the current iteration of the repeating started (unix timestamp) */
					const currentRepeatingStartTime = now - nowInRepeating

					repeatAddition = currentRepeatingStartTime - firstPartStartTime
				} else {
					repeatAddition = 0
				}

				const partStartTime = firstPartStartTime + repeatAddition

				const partEndTime = playingPart.duration === null ? null : partStartTime + playingPart.duration

				const isPaused = partPauseTime !== undefined
				const playheadTime = isPaused ? partPauseTime : now - partStartTime
				const timeUntilPart = isPaused ? 0 : partStartTime - now

				addCountdown(playData, playingPart.part, timeUntilPart)
				if (playingPart.endAction === 'loop' && playingPart.duration !== null) {
					addCountdown(playData, playingPart.part, timeUntilPart + playingPart.duration) // Also add for the next repeating loop
				}

				if (isPaused || (now >= partStartTime && (partEndTime === null || now < partEndTime))) {
					if (partPauseTime === undefined) playData.allPartsArePaused = false
					playData.anyPartIsPlaying = true

					playData.playheads[playingPartId] = {
						playheadTime: playheadTime,
						partStartTime: partStartTime,
						partPauseTime: partPauseTime,
						partEndTime: partEndTime,
						partDuration: playingPart.duration,
						endAction: playingPart.endAction,
						isInRepeating: Boolean(playingPart.part.loop),
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
export interface GroupPlayData {
	/** If the Group is playing (this is always false if one-at-a-time is set) */
	groupIsPlaying: boolean
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
	/** What the playhead will to when it reaches the partEndTime */
	endAction: 'stop' | 'next' | 'loop' | 'infinite'

	/** Whether the playhead has entered the repeating section of parts */
	isInRepeating: boolean
}
