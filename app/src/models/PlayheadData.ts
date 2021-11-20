import { RundownModel } from './RundownModel'

/**
 * Defines how the rundowns will be played.
 * First there is the array of rundowns that will be played in order.
 * Then there is the repeating array of rundowns that will be played afterwards, and looped.
 */
export interface GroupPreparedPlayheadData {
	/** Timestamp, starting time of the first rundown-to-be-played */
	startTime: number
	/** Total duration of the rundowns in .rundowns. */
	duration: number
	rundowns: {
		/**
		 * The point in time the rundown starts to play. (Starts at 0, relative to GroupPreparedPlayheadData.startTime) */
		startTime: number
		rundown: RundownModel
	}[]

	repeating: {
		duration: number
		rundowns: {
			/** The point in time the rundown starts to play. (Starts at 0, relative to when the repeating starts. ie startTime + duration) */
			startTime: number
			rundown: RundownModel
		}[]
	} | null
}
