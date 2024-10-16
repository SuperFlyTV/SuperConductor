import { Part } from '../rundown/Part.js'

/**
 * Defines how the parts will be played.
 * First there is the array of parts that will be played in order.
 * Then there is the repeating array of parts that will be played afterwards, and looped.
 */
export type GroupPreparedPlayData = GroupPreparedPlayDataSingle | GroupPreparedPlayDataMulti
export interface GroupPreparedPlayDataBase {
	type: 'single' | 'multi'

	/** Timestamp, at which point the prepared data needs to be recalculated */
	validUntil: number | undefined
}
/** Defines how the parts will be played, when there's a single part at a time playing */
export interface GroupPreparedPlayDataSingle extends GroupPreparedPlayDataBase {
	type: 'single'
	sections: GroupPreparedPlayDataSection[]
}

export interface GroupPreparedPlayDataMulti extends GroupPreparedPlayDataBase {
	type: 'multi'
	sections: {
		[partId: string]: GroupPreparedPlayDataSection[]
	}
}

export interface GroupPreparedPlayDataSection {
	/** Starting time of the first part in this section (unix timestamp) [ms] */
	startTime: number
	/** If set, startTime is disregarded and the section is instead paused at the pauseTime (0 is start of the section) [ms] */
	pauseTime: number | undefined
	/** If set, the content of the section is intended to stop at this time */
	stopTime: number | undefined

	/** End time of the section (like when another section starts) (unix timestamp) [ms] */
	endTime: number | null

	/** Total duration of the parts in .parts. null = infinite [ms] */
	duration: number | null
	parts: GroupPreparedPlayDataPart[]
	/** If the section is repeating or not */
	repeating?: boolean

	/** If the section originate from a schedule */
	schedule: boolean

	endAction: SectionEndAction
}
export interface GroupPreparedPlayDataPart {
	/** The point in time the part starts to play. (unix timestamp) [ms] */
	startTime: number
	/** If set, startTime is disregarded and the part is instead paused at the pauseTime (0 is start of the part) [ms] */
	// pauseTime: number | undefined
	/** Duration of the part, null = infinite [ms] */
	duration: number | null

	part: Part

	/** What the playhead will do when it reaches the end of the part */
	endAction?: PlayPartEndAction
}

export enum SectionEndAction {
	/** Playout will stop */
	STOP = 'stop',
	/** Will play the next section in group */
	NEXT_SECTION = 'next',
	/** Will play the same section in a loop */
	LOOP_SELF = 'loop_self',
	/** Will continue to play this section indefinitely */
	INFINITE = 'infinite',
}

export enum PlayPartEndAction {
	/** Playout will stop */
	STOP = 'stop',
	/** Will play the next part in group */
	NEXT_PART = 'next',
	/** Will play the same part in a loop */
	LOOP_SELF = 'loop_self',
	/** Will be interrupted by a schedule */
	SCHEDULE = 'schedule',
	/** Will continue to play this part indefinitely */
	INFINITE = 'infinite',
}
