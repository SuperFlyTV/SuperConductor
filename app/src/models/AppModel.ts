import { Mappings } from 'timeline-state-resolver-types'
import { GroupModel } from './GroupModel'
import { MediaModel } from './MediaModel'
import { RundownModel } from './RundownModel'
import { TemplateModel } from './TemplateModel'

export type AppModel = {
	rundowns: Rundowns
	selectedTimelineObjId?: string
	media: MediaModel[]
	templates: TemplateModel[]
	mappings: Mappings | undefined
}

export type Rundowns = (RundownModel | GroupModel)[]
