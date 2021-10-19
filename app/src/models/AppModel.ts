import { GroupModel } from './GroupModel'
import { MediaModel } from './MediaModel'
import { RundownModel } from './RundownModel'

export type AppModel = { rundowns: Rundowns; selectedTimelineObjId?: string; media: MediaModel[] }

export type Rundowns = (RundownModel | GroupModel)[]
