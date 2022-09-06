import { KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { ActionAny, ProjectAction } from '../action'
import {
	formatKeyDuration,
	formatKeyTimeToEnd,
	getLongestActionDuration,
	groupIsSelected,
	partIsSelected,
	TriggerArea,
	triggersAreaToArea,
	_getKeyDisplay,
} from './lib'

export function keyDisplayProjectPlay(
	firstAction: ProjectAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Play ${label}`,
				short: `▶${label}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		paused: ({ action, currentPart, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'project') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

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
			} else if (action.type === 'project') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			const label = getSelectionLabel(firstAction)
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
export function keyDisplayProjectStop(
	firstAction: ProjectAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Stop ${label}`,
				short: `⏹${label}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		playing: ({ action, group, currentPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (!group.oneAtATime && action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'project') {
				if (!group.oneAtATime && !partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

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
export function keyDisplayProjectPlayStop(
	firstAction: ProjectAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Play ${label}`,
				short: `▶${label}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		paused: ({ action, currentPart, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'project') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

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
			} else if (action.type === 'project') {
				if (!partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

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
export function keyDisplayProjectPause(
	firstAction: ProjectAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Cue ${label}`,
				short: `⏵⏸${label}`,
			},
			info: {
				long: formatKeyDuration(longestDuration),
			},
		},
		paused: ({ action, currentPart, group }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'project') {
				if (!group.oneAtATime && !groupIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: `${currentPart.resolved.label} ${formatKeyTimeToEnd(longestDuration)}`,
				},
			}
		},
		playing: ({ action, group, currentPart }) => {
			// Only show the playing state while OUR part is playing:
			if (action.type === 'rundown') {
				if (!group.oneAtATime && action.part.id !== currentPart.id) return null // Display idle
			} else if (action.type === 'project') {
				if (!group.oneAtATime && !partIsSelected(action.selected, currentPart.id)) return null // Display idle
			} else assertNever(action)

			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Pause ${label}`,
					short: `⏸${label}`,
				},
				info: {
					long: `${currentPart.resolved.label}` + formatKeyTimeToEnd(longestDuration),
				},
			}
		},
	})
}
export function keyDisplayProjectNext(
	firstAction: ProjectAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.IGNORE,
			area: triggersAreaToArea(triggerArea, false),
			header: {
				long: `Next ${label}`,
				short: `⏭${label}`,
			},
		},
		playing: () => {
			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Next ${label}`,
					short: `⏭${label}`,
				},
				info: {
					long: formatKeyDuration(longestDuration),
				},
			}
		},
	})
}
export function keyDisplayProjectPrevious(
	firstAction: ProjectAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.IGNORE,
			area: triggersAreaToArea(triggerArea, false),
			header: {
				long: `Previous ${label}`,
				short: `⏮${label}`,
			},
		},
		playing: () => {
			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Previous ${label}`,
					short: `⏮${label}`,
				},
				info: {
					long: formatKeyDuration(longestDuration),
				},
			}
		},
	})
}

function getSelectionLabel(firstAction: ProjectAction): string {
	let labels: string[] = []
	let partCount = 0
	let groupCount = 0

	for (const selected of firstAction.selected) {
		if (selected.type === 'group') {
			groupCount++
			labels.push(selected.group.name)
		} else if (selected.type === 'part') {
			partCount++
			labels.push(selected.part.resolved.label)
		} else assertNever(selected)
	}

	if (labels.length === 0) return ''
	else if (labels.length === 1) return labels[0]
	else if (partCount === 0 && groupCount > 0) return `${groupCount} Groups`
	else if (groupCount === 0 && partCount > 0) return `${partCount} Parts`
	else if (groupCount > 0 && partCount > 0) return `-Multiple-`
	else if (groupCount === 0 && partCount === 0) return ''
	// Won't really ever happen
	else return `N/A`
}
