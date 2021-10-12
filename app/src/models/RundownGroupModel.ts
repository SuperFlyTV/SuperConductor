import { RundownModel } from './RundownModel'

export type RundownGroupModel = {
	name: string
	type: 'group'
	rundowns: RundownModel[]
}
