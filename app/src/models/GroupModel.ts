import { RundownModel } from './RundownModel'

export type GroupModel = {
	name: string
	type: 'group'
	rundowns: RundownModel[]
}
