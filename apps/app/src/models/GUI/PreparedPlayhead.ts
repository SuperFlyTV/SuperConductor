import { Part } from '../rundown/Part'

/**
 * Defines how the parts will be played.
 * First there is the array of parts that will be played in order.
 * Then there is the repeating array of parts that will be played afterwards, and looped.
 */
export type GroupPreparedPlayData = GroupPreparedPlayDataSingle | GroupPreparedPlayDataMulti
export interface GroupPreparedPlayDataBase {
	type: 'single' | 'multi'
}
/** Defines how the parts will be played, when there's a single part at a time playing */
export interface GroupPreparedPlayDataSingle extends GroupPreparedPlayDataBase {
	type: 'single'
	/** Timestamp, starting time of the first part-to-be-played (unit timestamp) [ms] */
	startTime: number
	/** Total duration of the parts in .parts. [ms] */
	duration: number
	parts: GroupPreparedPlayDataPart[]

	repeating: {
		/** Total duration of the repeating.parts */
		duration: number
		parts: GroupPreparedPlayDataPart[]
	} | null
}

export interface GroupPreparedPlayDataMulti extends GroupPreparedPlayDataBase {
	type: 'multi'
	parts: {
		[partId: string]: GroupPreparedPlayDataPart
	}
}

export interface GroupPreparedPlayDataPart {
	/**
	 * The point in time the part starts to play. (unix timestamp) [ms] */
	startTime: number
	/** Duration of the part [ms] */
	duration: number
	part: Part

	/** What the playhead should do when it reaches the end of the part */
	endAction: 'stop' | 'next' | 'loop'
}
