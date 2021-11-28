import { TSRTimelineObj } from 'timeline-state-resolver-types'

export type PartModel = {
	id: string
	name: string
	timeline: TSRTimelineObj[]

	resolved: {
		duration: number
	}
}
