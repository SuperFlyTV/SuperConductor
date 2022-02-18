import { Group } from '../../models/rundown/Group'
import { Part } from '../../models/rundown/Part'
import { Trigger } from '../../models/rundown/Trigger'

export interface Action {
	trigger: Trigger
	rundownId: string
	group: Group
	part: Part
}
