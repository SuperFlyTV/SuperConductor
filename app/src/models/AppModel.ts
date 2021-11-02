import { Mappings } from 'timeline-state-resolver-types'
import { GroupModel } from './GroupModel'
import { MediaModel } from './MediaModel'
import { RundownModel } from './RundownModel'

export type AppModel = {
	rundowns: Rundowns
	selectedTimelineObjId?: string
	media: MediaModel[]
	mappings: Mappings | undefined
}

export type Rundowns = (RundownModel | GroupModel)[]
