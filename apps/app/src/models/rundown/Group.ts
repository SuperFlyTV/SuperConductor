import { GroupPreparedPlayData } from '../GUI/PreparedPlayhead'
import { Part } from './Part'

export type Group = {
	id: string
	name: string

	/** A transparent group is one that only has a single part, ie "hidden from the user" */
	transparent: boolean

	oneAtATime: boolean
	autoPlay: boolean
	loop: boolean
	disabled?: boolean
	locked?: boolean

	/** Whether or not this Group should be visually collapsed in the app view. Does not affect playout. */
	collapsed?: boolean

	parts: Part[]

	/** Data related to the playout of the group */
	playout: {
		/** Map of the part(s) currently playing */
		playingParts: {
			[partId: string]: {
				/** Timestamp of when the part started playing (unix timestamp) */
				startTime: number

				/** If set, startTime is disregarded and the part is instead paused at the pauseTime (0 is start of the part) [ms] */
				pauseTime: number | undefined
			}
		}
	}

	/** This is populated by the backend, as the timeline is build. */
	preparedPlayData: GroupPreparedPlayData | null
}
