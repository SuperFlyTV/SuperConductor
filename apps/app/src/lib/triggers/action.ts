import { Rundown } from '../../models/rundown/Rundown'
import { Group } from '../../models/rundown/Group'
import { Part } from '../../models/rundown/Part'
import { ActiveTrigger, activeTriggersToString, Trigger } from '../../models/rundown/Trigger'
import { Project } from '../../models/project/Project'

export interface Action {
	trigger: Trigger
	rundownId: string
	group: Group
	part: Part
}

export function getAllActionsInRundowns(rundowns: Rundown[], project: Project): Action[] {
	const actions: Action[] = []
	// Collect all actions from the rundowns:
	const groups = new Map<
		string,
		{
			rundownId: string
			group: Group
		}
	>()
	for (const rundown of rundowns) {
		for (const group of rundown.groups) {
			groups.set(group.id, {
				rundownId: rundown.id,
				group,
			})

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
	// Collect actions from Areas:

	for (const [bridgeId, bridge] of Object.entries(project.bridges)) {
		for (const [deviceId, peripheralSettings] of Object.entries(bridge.peripheralSettings)) {
			for (const [_areaId, area] of Object.entries(peripheralSettings.areas)) {
				if (area.assignedToGroupId) {
					const group = groups.get(area.assignedToGroupId)
					if (group && !group.group.disabled) {
						// Assign the keys in the area to actions in the Parts of the group,
						// each in order:

						const playableParts = group.group.parts.filter((part) => !part.disabled)
						for (let i = 0; i < area.identifiers.length; i++) {
							const identifier = area.identifiers[i]
							const part = playableParts[i]
							if (identifier !== undefined && part) {
								const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`

								const activeTrigger: ActiveTrigger = {
									fullIdentifier: fullIdentifier,
									bridgeId,
									deviceId,
									deviceName: '',
									identifier,
								}
								const trigger: Trigger = {
									fullIdentifiers: [fullIdentifier],
									action: area.action || 'playStop',
									label: activeTriggersToString([activeTrigger]),
								}
								actions.push({
									trigger,
									rundownId: group.rundownId,
									group: group.group,
									part,
								})
							}
						}
					}
				}
			}
		}
	}

	return actions
}
