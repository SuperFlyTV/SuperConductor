import { GroupPreparedPlayData } from '../GUI/PreparedPlayhead'
import { Part } from './Part'

export type Group = {
	id: string
	name: string

	triggers: {
		[fullIdentifier: string]: {
			action: 'play' | 'stop'
		}
	}

	/** A transparent group is one that only has a single part, ie "hidden from the user" */
	transparent: boolean

	oneAtATime: boolean
	autoPlay: boolean
	loop: boolean

	parts: Part[]

	/** Data related to the playout of the group */
	playout: {
		/** Map of the part(s) currently playing */
		playingParts: {
			[partId: string]: {
				/** Timestamp of when the part started playing (unix timestamp) */
				startTime: number
			}
		}
	}

	/** This is populated by the backend, as the timeline is build. */
	preparedPlayData: GroupPreparedPlayData | null
}
