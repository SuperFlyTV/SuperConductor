import { Mappings } from 'timeline-state-resolver-types'
import { GroupModel } from './GroupModel'
import { MediaModel } from './MediaModel'
import { RundownModel } from './RundownModel'
import { TemplateModel } from './TemplateModel'

export type AppModel = {
	rundowns: RundownOrGroupModel[]
	selectedTimelineObjId?: string
	media: MediaModel[]
	templates: TemplateModel[]
	mappings: Mappings | undefined
}

export type RundownOrGroupModel = RundownModel | GroupModel
