import { GroupPreparedPlayheadData } from './PlayheadData'
import { PartModel } from './PartModel'

export type GroupModel = {
	id: string
	name: string

	/** A transparent group is one that only has a single part, ie "hidden from the user" */
	transparent: boolean

	autoPlay: boolean
	loop: boolean
	parts: PartModel[]

	/** Data related to the playout of the group */
	playout: {
		/** Timestamp for when the part (.startPartId) started playing. null = not playing */
		startTime: number | null
		/** The ids of the parts to be played (in this order) */
		partIds: string[]
	}

	/** This is populated by the backend, as the timeline is build. */
	playheadData: GroupPreparedPlayheadData | null
}
