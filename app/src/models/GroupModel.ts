import { RundownModel } from './RundownModel'

export type GroupModel = {
	id: string
	name: string
	type: 'group'
	loop: boolean
	rundowns: RundownModel[]
}
