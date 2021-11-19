import { TSRTimelineObj } from 'timeline-state-resolver-types'

export type RundownModel = {
	id: string
	name: string
	timeline: TSRTimelineObj[]

	resolved: {
		duration: number
	}
}
