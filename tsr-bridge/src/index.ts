import { DeviceType, TSRTimelineObj } from 'timeline-state-resolver'
import { Mappings, Timeline, TSRTimeline } from 'timeline-state-resolver-types'
import { KoaServer } from './KoaServer'
import { TSR } from './TSR'

const tsr = new TSR()

let mapping: Mappings | undefined = undefined

const storedTimelines: {
	[id: string]: Timeline.TimelineObject
} = {}

let storedTimeline: TSRTimeline | null = null

function updateTSR() {
	const timelines = Object.values(storedTimelines)
	// tsr.conductor.setTimelineAndMappings(Object.values(storedTimelines), tsr.allInputs.mappings)
	// tsr.conductor.setTimelineAndMappings(timelines, tsr.allInputs.mappings)
	// console.log('Updating TSR', storedTimeline)
	tsr.conductor.setTimelineAndMappings(storedTimeline!, mapping)
}

const playTimeline = (id: string, groupId: string, newTimeline: TSRTimeline, newMapping: Mappings) => {
	// create a group

	// storedTimeline = [
	// 	{
	// 		id: id,
	// 		enable: {
	// 			start: Date.now(),
	// 		},
	// 		layer: '',
	// 		children: newTimeline,
	// 		isGroup: true,
	// 		content: { deviceType: DeviceType.ABSTRACT, type: 'empty' },
	// 	},
	// ]

	storedTimeline = newTimeline

	// // storedTimelines[id] = newTimeline
	// storedTimeline = newTimeline.map((nt) => {
	// 	;(nt.enable as any).start += Date.now()
	// 	return nt
	// })

	// // we actually should look up others with the same groupId and remove them:
	// Object.entries(storedTimelines).forEach(([id, obj]) => {
	// 	if (obj.layer === groupId) {
	// 		delete storedTimelines[id]
	// 	}
	// })

	mapping = newMapping

	updateTSR()
	return Date.now()
}

const stopTimeline = (id: string) => {
	// delete storedTimelines[id]
	storedTimeline = []
	updateTSR()
}

const koaServer = new KoaServer({
	playTimeline,
	stopTimeline,
})
