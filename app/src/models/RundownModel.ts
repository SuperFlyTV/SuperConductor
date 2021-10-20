import { TSRTimelineObj } from 'timeline-state-resolver-types'

export type RundownModel = {
	id: string
	name: string
	type: 'rundown'
	timeline: TSRTimelineObj[]
}
