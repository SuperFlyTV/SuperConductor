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

	/** Is set when the group is playing. */
	playing: {
		/** Timestamp for when it started playing */
		startTime: number
		/** The id of the rundown we started playing */
		startRundownId: string
	} | null

	/** This is populated by the backend, as the timeline is build. */
	playheadData: GroupPreparedPlayheadData | null
}
