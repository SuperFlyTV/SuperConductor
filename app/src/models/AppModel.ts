import { Mappings } from 'timeline-state-resolver-types'
import { GroupModel } from './GroupModel'
import { MediaModel } from './MediaModel'
import { RundownModel } from './RundownModel'
import { TemplateModel } from './TemplateModel'

export type AppModel = {
	groups: GroupModel[]
	selectedTimelineObjId: string | undefined
	media: MediaModel[]
	templates: TemplateModel[]
	mappings: Mappings | undefined
}
