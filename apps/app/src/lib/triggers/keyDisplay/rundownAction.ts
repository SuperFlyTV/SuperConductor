import { KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { GroupBase } from '../../../models/rundown/Group'
import { PartBase } from '../../../models/rundown/Part'
import { ActionAny, RundownAction } from '../action'
import {
	formatKeyDuration,
	getLongestActionDuration,
	partIsSelected,
	TriggerArea,
	triggersAreaToArea,
	_getKeyDisplay,
} from './lib'

export function keyDisplayRundownPlay(
	firstAction: RundownAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Play ${firstAction.part.resolved.label}`,
				short: `▶${firstAction.part.resolved.label}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		paused: ({ action, currentPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			const label = firstAction.part.resolved.label
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: formatKeyDuration(longestDuration),
				},
			}
		},
		playing: ({ action, currentPart }) => {
			// if (action.type === 'rundown') {
			// } else if (action.type === 'application') {
			// } else {
			// 	assertNever(action)
			// 	return null
			// }
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			const label = firstAction.part.resolved.label
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: longestDuration === null ? '-' : `#timeToEnd`,
				},
			}
		},
	})
}
export function keyDisplayRundownStop(
	firstAction: RundownAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Stop ${getLabel(actions, firstAction.part)}`,
				short: `⏹${getLabel(actions, firstAction.part)}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		playing: ({ action, group, currentPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (!group.oneAtATime && action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!group.oneAtATime && !partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			const label = getLabel(actions, currentPart)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: `${currentPart.resolved.label}` + (longestDuration === null ? '' : '\n#timeToEnd'),
				},
			}
		},
	})
}
export function keyDisplayRundownPlayStop(
	firstAction: RundownAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Play ${firstAction.part.resolved.label}`,
				short: `▶${firstAction.part.resolved.label}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		paused: ({ action, currentPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			const label = firstAction.part.resolved.label
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: formatKeyDuration(longestDuration),
				},
			}
		},
		playing: ({ action, currentPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
				// if (!data.group.oneAtATime && data.action.part.id !== data.part.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			const label = getLabel(actions, currentPart)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: `${currentPart.resolved.label}` + (longestDuration === null ? '' : '\n#timeToEnd'),
				},
			}
		},
	})
}
function getLabel(actions: ActionAny[], part: PartBase) {
	if (actions.length === 0) throw new Error('Actions array is empty')

	let firstActionGroup: GroupBase | undefined = undefined
	let actionsAreInSameGroup = true
	let groupId = ''
	for (const action of actions) {
		const actionGroups: GroupBase[] = []
		if (action.type === 'rundown') {
			actionGroups.push(action.group)
		} else if (action.type === 'application') {
			for (const selected of action.selected) {
				actionGroups.push(selected.group)
			}
		} else assertNever(action)

		for (const actionGroup of actionGroups) {
			if (!firstActionGroup) firstActionGroup = actionGroup
			if (!groupId) {
				groupId = actionGroup.id
			} else if (groupId !== actionGroup.id) {
				actionsAreInSameGroup = false
				break
			}
		}
	}
	if (firstActionGroup && actionsAreInSameGroup && firstActionGroup.oneAtATime) {
		return firstActionGroup.name
	} else if (actions.length > 1) {
		return `#${actions.length}`
	} else {
		return part.resolved.label
	}
}
