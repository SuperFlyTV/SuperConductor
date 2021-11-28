import { Mappings } from 'timeline-state-resolver-types'
import { GroupModel } from './GroupModel'
import { MediaModel } from './MediaModel'
import { TemplateModel } from './TemplateModel'

export type AppModel = {
	groups: GroupModel[]
	media: MediaModel[]
	templates: TemplateModel[]
	mappings: Mappings | undefined
}
