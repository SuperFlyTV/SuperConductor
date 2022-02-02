import { GroupPreparedPlayheadData } from '../GUI/PreparedPlayhead'
import { Part } from './Part'

export type Group = {
	id: string
	name: string

	/** A transparent group is one that only has a single part, ie "hidden from the user" */
	transparent: boolean

	autoPlay: boolean
	loop: boolean
	parts: Part[]

	/** Data related to the playout of the group */
	playout: {
		/** Timestamp for when the part (.partId) started playing. null = not playing */
		startTime: number | null
		/** The ids of the part to be played */
		partId: string
	}

	/** This is populated by the backend, as the timeline is build. */
	playheadData: GroupPreparedPlayheadData | null
}
