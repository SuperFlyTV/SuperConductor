import { GroupModel } from './GroupModel'
import { RundownModel } from './RundownModel'

export type AppModel = (RundownModel | GroupModel)[]
