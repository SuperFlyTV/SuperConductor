import { Rundown } from '../../models/rundown/Rundown'
import { GroupBase } from '../../models/rundown/Group'
import { PartBase } from '../../models/rundown/Part'
import { AppData } from '../../models/App/AppData'
import { ActiveTrigger, activeTriggersToString, RundownTrigger, ApplicationTrigger } from '../../models/rundown/Trigger'
import { Project } from '../../models/project/Project'
import { PeripheralStatus } from '../../models/project/Peripheral'
import { GroupWithShallowParts, PartWithRef } from '../util'
import { CurrentSelectionAny } from '../GUI'
import { assertNever } from '@shared/lib'

export type ActionAny =
	| ({
			type: 'rundown'
	  } & RundownAction)
	| ({
			type: 'application'
	  } & ApplicationAction)

export interface RundownActionLight {
	trigger: RundownTrigger
	rundownId: string
	part: PartBase
	area: {
		id: string
		name: string
	} | null
}
export interface RundownAction extends RundownActionLight {
	group: GroupBase
}

export type ApplicationActionSelected =
	| {
			type: 'group'
			rundownId: string
			group: GroupBase
	  }
	| {
			type: 'part'
			rundownId: string
			group: GroupBase
			part: PartBase
	  }
export interface ApplicationAction {
	selected: ApplicationActionSelected[]
	trigger: ApplicationTrigger
}

export function getPartsWithRefInRundowns(rundowns: Rundown[]): PartWithRef[] {
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
	return allParts
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
				area: null,
			})
		}
	}
	// Collect actions from Areas:

	for (const [bridgeId, bridge] of Object.entries(project.bridges)) {
		for (const [deviceId, peripheralSettings] of Object.entries(bridge.clientSidePeripheralSettings)) {
			const peripheralStatus: PeripheralStatus | undefined = peripherals?.[`${bridgeId}-${deviceId}`]

			for (const [areaId, area] of Object.entries(peripheralSettings.areas)) {
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
									area: {
										id: areaId,
										name: area.name,
									},
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

export function getAllApplicationActions(
	currentSelections: Readonly<CurrentSelectionAny[]>,
	allParts: PartWithRef[],
	appData: AppData
): ApplicationAction[] {
	const selected: ApplicationActionSelected[] = []

	const selectedGroupIds = new Set<string>()
	const selectedPartIds = new Set<string>()

	for (const currentSelection of currentSelections) {
		if (currentSelection.type === 'group') {
			selectedGroupIds.add(currentSelection.groupId)
		} else if (currentSelection.type === 'part') {
			selectedPartIds.add(currentSelection.partId)
		}
	}

	for (const currentSelection of currentSelections) {
		if (currentSelection.type === 'part') {
			if (selectedGroupIds.has(currentSelection.groupId)) {
				// The Group is already selected
				continue
			}
		} else if (currentSelection.type === 'timelineObj') {
			if (selectedGroupIds.has(currentSelection.groupId)) {
				// The Group is already selected
				continue
			} else if (selectedPartIds.has(currentSelection.partId)) {
				// The Part is already selected
				continue
			}
		}

		if (currentSelection.type === 'group') {
			const partGroup = allParts.find((p) => {
				return p.group.id === currentSelection.groupId
			})
			if (partGroup) {
				selected.push({
					type: 'group',
					rundownId: partGroup.rundown.id,
					group: partGroup.group,
				})
			}
		} else if (currentSelection.type === 'part' || currentSelection.type === 'timelineObj') {
			// Note: We don't do actions on the timelineObj themselves,
			// so we're just going to pick the part instead:
			const part = allParts.find((p) => {
				return p.part.id === currentSelection.partId
			})
			if (part) {
				selected.push({
					type: 'part',
					rundownId: part.rundown.id,
					group: part.group,
					part: part.part,
				})
			}
		} else assertNever(currentSelection)
	}

	const actions: ApplicationAction[] = []
	for (const triggers of Object.values(appData.triggers)) {
		if (triggers) {
			for (const trigger of triggers) {
				actions.push({
					selected,
					trigger,
				})
			}
		}
	}
	return actions
}
