import { DeviceType, TSRTimelineObj } from 'timeline-state-resolver'
import { Mappings, Timeline, TSRTimeline } from 'timeline-state-resolver-types'
import { KoaServer } from './KoaServer'
import { TSR } from './TSR'

const tsr = new TSR()

let mapping: Mappings | undefined = undefined

const storedTimelines: {
	[id: string]: TSRTimeline
} = {}

function updateTSR() {
	const fullTimeline: TSRTimeline = []

	for (const timeline of Object.values(storedTimelines)) {
		for (const obj of timeline) {
			fullTimeline.push(obj)
		}
	}
	console.log('fullTimeline', JSON.stringify(fullTimeline, undefined, 2))
	tsr.conductor.setTimelineAndMappings(fullTimeline, mapping)
}

const playTimeline = (id: string, newTimeline: TSRTimeline) => {
	storedTimelines[id] = newTimeline

	updateTSR()
	return Date.now()
}
const updateMappings = (newMapping: Mappings) => {
	mapping = newMapping
	updateTSR()
}

const stopTimeline = (id: string) => {
	delete storedTimelines[id]
	updateTSR()
}

const koaServer = new KoaServer({
	playTimeline,
	stopTimeline,
	updateMappings,
})
