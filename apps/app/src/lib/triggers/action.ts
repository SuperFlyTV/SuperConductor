import { Rundown } from '../../models/rundown/Rundown'
import { GroupBase } from '../../models/rundown/Group'
import { PartBase } from '../../models/rundown/Part'
import { ActiveTrigger, activeTriggersToString, RundownTrigger, ProjectTrigger } from '../../models/rundown/Trigger'
import { Project } from '../../models/project/Project'
import { PeripheralStatus } from '../../models/project/Peripheral'
import { GroupWithShallowParts, PartWithRef } from '../util'

export type ActionAny =
	| {
			type: 'rundown'
			action: RundownAction
	  }
	| {
			type: 'project'
			action: ProjectAction
	  }

export interface RundownActionLight {
	trigger: RundownTrigger
	rundownId: string
	part: PartBase
}
export interface RundownAction extends RundownActionLight {
	group: GroupBase
}

export interface ProjectAction {
	trigger: ProjectTrigger
}

export function getAllActionsInRundowns(
	rundowns: Rundown[],
	project: Project,
	peripherals: { [peripheralId: string]: PeripheralStatus } | undefined
) {
	const allParts: PartWithRef[] = []
	for (const rundown of rundowns) {
		for (const group of rundown.groups) {
			for (const part of group.parts) {
				allParts.push({
					rundown,
					group,
					part,
				})
			}
		}
	}

	return getAllActionsInParts(allParts, project, peripherals)
}
export function getAllActionsInParts(
	allParts: PartWithRef[],
	project: Project,
	peripherals: { [peripheralId: string]: PeripheralStatus } | undefined
): RundownAction[] {
	const actions: RundownAction[] = []
	// Collect all actions from the rundowns:
	const groups = new Map<
		string,
		{
			rundownId: string
			group: GroupWithShallowParts
		}
	>()
	for (const p of allParts) {
		if (!groups.has(p.group.id)) {
			groups.set(p.group.id, {
				rundownId: p.rundown.id,
				group: p.group,
			})
		}
		for (const trigger of p.part.triggers) {
			actions.push({
				trigger,
				rundownId: p.rundown.id,
				group: p.group,
				part: p.part,
			})
		}
	}
	// Collect actions from Areas:

	for (const [bridgeId, bridge] of Object.entries(project.bridges)) {
		for (const [deviceId, peripheralSettings] of Object.entries(bridge.peripheralSettings)) {
			const peripheralStatus: PeripheralStatus | undefined = peripherals?.[`${bridgeId}-${deviceId}`]

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
									deviceName: peripheralStatus?.info.name ?? '',
									identifier,
								}
								const trigger: RundownTrigger = {
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

export function getAllProjectActions(project: Project): ProjectAction[] {
	return project.actions
}
