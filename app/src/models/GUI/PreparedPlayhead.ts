import { Part } from '../rundown/Part'

/**
 * Defines how the parts will be played.
 * First there is the array of parts that will be played in order.
 * Then there is the repeating array of parts that will be played afterwards, and looped.
 */
export interface GroupPreparedPlayheadData {
	/** Timestamp, starting time of the first part-to-be-played */
	startTime: number
	/** Total duration of the parts in .parts. */
	duration: number
	parts: {
		/**
		 * The point in time the part starts to play. (Starts at 0, relative to GroupPreparedPlayheadData.startTime) */
		startTime: number
		part: Part
	}[]

	repeating: {
		/** Total duration of the repeating.parts */
		duration: number
		parts: {
			/** The point in time the part starts to play. (Starts at 0, relative to when the repeating starts. ie startTime + duration) */
			startTime: number
			part: Part
		}[]
	} | null
}
