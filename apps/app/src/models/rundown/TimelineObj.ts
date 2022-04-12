import { TSRTimelineObj } from 'timeline-state-resolver-types'

export interface TimelineObj {
	resourceId?: string

	obj: TSRTimelineObj

	resolved: {
		instances: TimelineObjResolvedInstance[]
	}
}

export interface TimelineObjResolvedInstance {
	/** The resolved startTime of the object. 0 is the beginning of the Part */
	start: number
	/** The resolved sendTime of the object. 0 is the beginning of the Part, null = Infinity */
	end: number | null
}
