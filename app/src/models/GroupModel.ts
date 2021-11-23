import { GroupPreparedPlayheadData } from './PlayheadData'
import { RundownModel } from './RundownModel'

export type GroupModel = {
	id: string
	name: string

	/** A transparent group is one that only has a single rundown, ie "hidden from the user" */
	transparent: boolean

	autoPlay: boolean
	loop: boolean
	rundowns: RundownModel[]

	/** Data related to the playout of the group */
	playout: {
		/** Timestamp for when the rundown (.startRundownId) started playing. null = not playing */
		startTime: number | null
		/** The ids of the rundowns to be played (in this order) */
		rundownIds: string[]
	}

	/** This is populated by the backend, as the timeline is build. */
	playheadData: GroupPreparedPlayheadData | null
}
