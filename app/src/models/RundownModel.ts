import { TSRTimelineObj } from 'timeline-state-resolver-types'

export type RundownModel = {
	name: string
	type: 'rundown'
	timeline: TSRTimelineObj[]
}
