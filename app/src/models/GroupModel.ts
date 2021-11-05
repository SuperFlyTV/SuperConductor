import { RundownOrGroupModel } from './AppModel'

export type GroupModel = {
	id: string
	name: string
	type: 'group'
	loop: boolean
	rundowns: RundownOrGroupModel[]
}
