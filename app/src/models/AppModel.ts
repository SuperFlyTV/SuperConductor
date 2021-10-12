import { RundownGroupModel } from './RundownGroupModel'
import { RundownModel } from './RundownModel'

export type AppModel = (RundownModel | RundownGroupModel)[]
