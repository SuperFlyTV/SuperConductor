import { TSRTimeline } from 'timeline-state-resolver-types'
import { KoaServer } from './KoaServer'
import { TSR } from './TSR'

const tsr = new TSR()

const handleTimeline = (timeline: TSRTimeline) => {
	timeline.map((item) => {
		;(item.enable as any).start += Date.now()
		return item
	})

	tsr.conductor.setTimelineAndMappings(timeline, tsr.allInputs.mappings)
	tsr.conductor.init()
}

const koaServer = new KoaServer({
	handleTimeline,
})
