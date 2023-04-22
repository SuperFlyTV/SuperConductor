import { TSRTimelineContent, TSRTimelineObj } from 'timeline-state-resolver-types'

export interface TimelineObj {
	resourceId?: string

	obj: TSRTimelineObj<TSRTimelineContent>

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

/**
 * Default duration of timeline-objects. If the duration is infinite,
 * this duration is used instead in GUI when starting a drag operation.
 */
export const DEFAULT_DURATION = 10 * 1000
