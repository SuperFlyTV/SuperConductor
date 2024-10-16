import { KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { GroupBase } from '../../../models/rundown/Group.js'
import { PartBase } from '../../../models/rundown/Part.js'
import { ActionAny, RundownAction } from '../action.js'
import {
	formatKeyDuration,
	formatKeyTimeToEnd,
	getLongestActionDuration,
	partIsSelected,
	TriggerArea,
	triggersAreaToArea,
	_getKeyDisplay,
} from './lib.js'

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
		paused: ({ action, pausedPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== pausedPart.part.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, pausedPart.part.id)) return null // Display idle
			} else assertNever(action)

			const label = firstAction.part.resolved.label
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Restart ${label}`,
					short: `↺${label}`,
				},
				info: {
					long: formatKeyDuration(longestDuration),
				},
			}
		},
		playing: ({ action, playingPart }) => {
			// if (action.type === 'rundown') {
			// } else if (action.type === 'application') {
			// } else {
			// 	assertNever(action)
			// 	return null
			// }
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== playingPart.part.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, playingPart.part.id)) return null // Display idle
			} else assertNever(action)

			const label = firstAction.part.resolved.label
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Restart ${label}`,
					short: `↺${label}`,
				},
				info: {
					long: formatKeyTimeToEnd(longestDuration),
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
		playing: ({ action, group, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (!group.oneAtATime && action.part.id !== playingPart.part.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!group.oneAtATime && !partIsSelected(action.selected, playingPart.part.id)) return null // Display idle
			} else assertNever(action)

			const label = getLabel(actions, playingPart.part)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: [playingPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
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
		paused: ({ action, pausedPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== pausedPart.part.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, pausedPart.part.id)) return null // Display idle
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
		playing: ({ action, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== playingPart.part.id) return null // Display idle
				// if (!data.group.oneAtATime && data.action.part.id !== data.part.id) return null // Display idle
			} else if (action.type === 'application') {
				if (!partIsSelected(action.selected, playingPart.part.id)) return null // Display idle
			} else assertNever(action)

			const label = getLabel(actions, playingPart.part)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: [playingPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
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
