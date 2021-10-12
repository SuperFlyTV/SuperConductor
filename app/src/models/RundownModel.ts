import Timeline from 'superfly-timeline'

export type RundownModel = {
	name: string
	type: 'rundown'
	timeline: Timeline.TimelineObject[]
}
