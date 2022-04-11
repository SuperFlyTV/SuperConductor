import { Rundown } from '../../models/rundown/Rundown'
import { Group } from '../../models/rundown/Group'
import { Part } from '../../models/rundown/Part'
import { Trigger } from '../../models/rundown/Trigger'

export interface Action {
	trigger: Trigger
	rundownId: string
	group: Group
	part: Part
}

export function getAllActionsInRundowns(rundowns: Rundown[]) {
	// Collect all actions from the rundowns:
	const actions: Action[] = []
	for (const rundown of rundowns) {
		for (const group of rundown.groups) {
			for (const part of group.parts) {
				for (const trigger of part.triggers) {
					actions.push({
						trigger,
						rundownId: rundown.id,
						group,
						part,
					})
				}
			}
		}
	}
	return actions
}
