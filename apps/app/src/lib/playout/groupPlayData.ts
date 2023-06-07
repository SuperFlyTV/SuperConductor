import {
	GroupPreparedPlayData,
	GroupPreparedPlayDataSection,
	PlayPartEndAction,
	SectionEndAction,
} from '../../models/GUI/PreparedPlayhead'
import { Part } from '../../models/rundown/Part'
import { assertNever, literal } from '@shared/lib'

/******************************************************************************
 *
 * The Group PlayData is intended to be re-calculated on every frame, using the
 * Prepared Group PlayData as base.
 * It contains calculated information about what is currently playing.
 *
 *****************************************************************************/

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

		sectionEndAction: null,
		sectionEndTime: null,
		sectionTimeToEnd: null,
	}

	if (prepared) {
		if (prepared.type === 'single') {
			let playhead: GroupPlayDataPlayhead | null = null
			for (const section of prepared.sections) {
				const currentPlayhead = getPlayheadForSection(playData, now, section)
				if (currentPlayhead) {
					playhead = currentPlayhead
				}

				const { sectionLastStartTime, sectionNextEndTime } = getSectionTimes(section, now)

				if (sectionLastStartTime <= now && sectionNextEndTime > now && (section.endTime || Infinity) > now) {
					//  && (section.endTime ?? Infinity) > now
					playData.sectionEndAction = section.endAction

					if (sectionNextEndTime !== Infinity) {
						playData.sectionEndTime = sectionNextEndTime
						playData.sectionTimeToEnd = playData.sectionEndTime - now
					} else if (section.pauseTime !== undefined && section.duration) {
						// Is paused
						playData.sectionEndTime = null
						playData.sectionTimeToEnd = section.duration - section.pauseTime
					} else if (section.repeating && section.duration) {
						// Is repeating
						playData.sectionEndTime = sectionLastStartTime + section.duration
						playData.sectionTimeToEnd = playData.sectionEndTime - now
					} else {
						playData.sectionEndTime = null
						playData.sectionTimeToEnd = null
					}
				}
			}

			if (playhead) {
				playData.groupIsPlaying = true
				playData.anyPartIsPlaying = true
				playData.playheads[playhead.partId] = playhead

				if (playhead.partPauseTime === undefined) playData.allPartsArePaused = false
			}
		} else if (prepared.type === 'multi') {
			for (const [partId, sections] of Object.entries<GroupPreparedPlayDataSection[]>(prepared.sections)) {
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

	playData.groupScheduledToPlay.sort((a, b) => a.duration - b.duration)

	return playData
}
/** Add a coundown until a Part */
function addCountdown(playData: GroupPlayData, part: Part, timestamp: number, now: number) {
	if (timestamp <= now) return

	if (!playData.countdowns[part.id]) playData.countdowns[part.id] = []
	playData.countdowns[part.id].push({
		duration: timestamp - now,
		timestamp: timestamp,
	})
}
function getSectionTimes(
	section: GroupPreparedPlayDataSection,
	now: number
): {
	/** Last start time of the section (when in a repeating section, the previous start time) */
	sectionLastStartTime: number
	/** Next end time (when in a repeating section, the next time the section will repeat ) */
	sectionNextEndTime: number
	/** How much to add to times to get the times in the current repetition [ms] */
	repeatAddition: number
	nextSectionStartTime: number | null
} {
	let sectionLastStartTime: number
	let sectionNextEndTime: number
	let repeatAddition: number

	const nowTime = section.pauseTime ?? now

	if (section.repeating && section.duration !== null && nowTime >= section.startTime) {
		/** A value that goes from 0 - repeating.duration */
		const nowInRepeating = (nowTime - section.startTime) % (section.duration ?? Infinity)

		/** When the current iteration of the repeating started (unix timestamp) */
		const currentRepeatingStartTime = nowTime - nowInRepeating

		/** How much to add to times to get the times in the current repetition [ms] */
		repeatAddition = Math.max(0, currentRepeatingStartTime - section.startTime)

		sectionLastStartTime = section.startTime + repeatAddition
		sectionNextEndTime = section.startTime + section.duration + repeatAddition
	} else {
		sectionLastStartTime = section.startTime
		sectionNextEndTime = section.endTime ?? Infinity
		repeatAddition = 0
	}

	const nextSectionStartTime = section.duration === null ? null : sectionLastStartTime + section.duration

	return {
		sectionLastStartTime,
		sectionNextEndTime,
		repeatAddition,
		nextSectionStartTime,
	}
}
function getPlayheadForSection(
	playData: GroupPlayData,
	now: number,
	section: GroupPreparedPlayDataSection
): GroupPlayDataPlayhead | null {
	let playhead: GroupPlayDataPlayhead | null = null

	const { sectionLastStartTime, sectionNextEndTime, repeatAddition, nextSectionStartTime } = getSectionTimes(
		section,
		now
	)

	if (sectionLastStartTime >= (section.endTime ?? Infinity)) return null

	if (section.schedule) {
		if (sectionLastStartTime >= now)
			playData.groupScheduledToPlay.push({
				duration: sectionLastStartTime - now,
				timestamp: sectionLastStartTime,
			})
		if (
			nextSectionStartTime !== null &&
			nextSectionStartTime > now &&
			nextSectionStartTime < (section.endTime ?? Infinity)
		)
			playData.groupScheduledToPlay.push({
				duration: nextSectionStartTime - now,
				timestamp: nextSectionStartTime,
			})
	}

	for (const part of section.parts) {
		/** Start time of the part, in this repetition (unix timestamp) */
		const partStartTime = part.startTime + repeatAddition

		/** End time of the part (unix timestamp) */
		const partEndTime = part.duration === null ? null : partStartTime + part.duration

		/** Time of playhead (0 is start of section) */
		const playheadTime =
			(section.pauseTime !== undefined ? section.pauseTime + section.startTime : now) - partStartTime

		if (section.pauseTime === undefined) {
			// Is not paused
			if (partStartTime >= section.startTime && partStartTime < (section.endTime ?? Infinity)) {
				addCountdown(playData, part.part, partStartTime, now)
			}

			if (section.repeating && section.duration !== null) {
				// Also add for the next repeating loop:
				const nextPartStartTime = partStartTime + section.duration
				if (nextPartStartTime >= section.startTime && nextPartStartTime < (section.endTime ?? Infinity)) {
					addCountdown(playData, part.part, nextPartStartTime, now)
				}
			}
		}

		if (
			playheadTime >= 0 &&
			playheadTime < (part.duration || Infinity) &&
			sectionNextEndTime > now &&
			(section.endTime || Infinity) > now
		) {
			playhead = literal<GroupPlayDataPlayhead>({
				playheadTime: playheadTime,
				partStartTime: partStartTime,
				partPauseTime: section.pauseTime,
				partEndTime: partEndTime,
				partDuration: part.duration,
				partId: part.part.id,
				isInRepeating: true,
				endAction: part.endAction,
				fromSchedule: section.schedule,
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
	groupScheduledToPlay: {
		duration: number
		timestamp: number
	}[]
	/** If any part in the group is playing */
	anyPartIsPlaying: boolean
	/** If all parts in the group are playing, and paused */
	allPartsArePaused: boolean

	/** Map of the playhead(s) */
	playheads: {
		[partId: string]: GroupPlayDataPlayhead
	}

	/** Time(s) until parts will start playing: */
	countdowns: {
		[partId: string]: {
			duration: number
			timestamp: number
		}[]
	}

	/** Time left to the end of the section content (is set even when paused) [ms] */
	sectionTimeToEnd: number | null
	/** Time when the section content ends next time (unix timestamp) [ms] */
	sectionEndTime: number | null

	sectionEndAction: SectionEndAction | null
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

	/** Whether the playhead has entered the repeating section of parts
	 * @deprecated not used?
	 */
	isInRepeating: boolean
	/** Whether the playhead comes from schedule */
	fromSchedule: boolean
}
