import { KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { GroupPreparedPlayDataPart } from '../../../models/GUI/PreparedPlayhead.js'
import { GroupBase } from '../../../models/rundown/Group.js'
import { ActionAny, ApplicationAction } from '../action.js'
import {
	formatKeyDuration,
	formatKeyTimeToEnd,
	getLongestActionDuration,
	groupIsSelected,
	partIsSelected,
	TriggerArea,
	triggersAreaToArea,
	_getKeyDisplay,
} from './lib.js'

export function keyDisplayApplicationPlay(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.NEUTRAL,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Play ${label}`,
							short: `▶${label}`,
						},
						info: {
							long: formatKeyDuration(longestDuration),
						},
					}
				: {
						// Nothing to play:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Play`,
							short: `▶`,
						},
					},

		paused: ({ action, group, pausedPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!isThisSelected(action, group, pausedPart)) return null // Display idle

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
		playing: ({ group, action, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!isThisSelected(action, group, playingPart)) return null // Display idle

			const label = getSelectionLabel(firstAction)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Restart ${label}`,
					short: `↺${label}`,
				},
				info: {
					long: [playingPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
				},
			}
		},
	})
}
export function keyDisplayApplicationStop(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.NEUTRAL,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Stop ${label}`,
							short: `⏹${label}`,
						},
						info: {
							long: formatKeyDuration(longestDuration),
						},
					}
				: {
						// Nothing to stop:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Stop`,
							short: `⏹`,
						},
					},
		paused: ({ action, group, pausedPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!group.oneAtATime && !isThisSelected(action, group, pausedPart)) return null // Display idle

			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: [pausedPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
				},
			}
		},
		playing: ({ action, group, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!group.oneAtATime && !isThisSelected(action, group, playingPart)) return null // Display idle

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
export function keyDisplayApplicationPlayStop(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.NEUTRAL,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Play ${label}`,
							short: `▶${label}`,
						},
						info: {
							long: formatKeyDuration(longestDuration),
						},
					}
				: {
						// Nothing to PlayStop:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Play / Stop`,
							short: `▶⏹`,
						},
					},
		paused: ({ action, group, pausedPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!isThisSelected(action, group, pausedPart)) return null // Display idle

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
		playing: ({ action, group, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!isThisSelected(action, group, playingPart)) return null // Display idle

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
export function keyDisplayApplicationPause(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.NEUTRAL,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Cue ${label}`,
							short: `⏵⏸${label}`,
						},
						info: {
							long: formatKeyDuration(longestDuration),
						},
					}
				: {
						// Nothing to Pause/Cue:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Cue`,
							short: `⏵⏸`,
						},
					},
		paused: ({ action, pausedPart, group }) => {
			// Only show the playing state while OUR part is playing:
			if (!group.oneAtATime && !isThisSelected(action, group, pausedPart)) return null // Display idle

			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: [pausedPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
				},
			}
		},
		playing: ({ action, group, playingPart }) => {
			// Only show the playing state while OUR part is playing:
			if (!group.oneAtATime && !isThisSelected(action, group, playingPart)) return null // Display idle

			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Pause ${label}`,
					short: `⏸${label}`,
				},
				info: {
					long: [playingPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
				},
			}
		},
	})
}
export function keyDisplayApplicationNext(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction, true)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),
						header: {
							long: `Next ${label}`,
							short: `⏭${label}`,
						},
					}
				: {
						// Nothing to Next:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Next`,
							short: `⏭`,
						},
					},
		playing: ({ playingPart }) => {
			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Next ${label}`,
					short: `⏭${label}`,
				},
				info: {
					long: [playingPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
				},
			}
		},
	})
}
export function keyDisplayApplicationPrevious(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	const label = getSelectionLabel(firstAction, true)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),
						header: {
							long: `Previous ${label}`,
							short: `⏮${label}`,
						},
					}
				: {
						// Nothing to Previous:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Previous`,
							short: `⏮`,
						},
					},
		playing: ({ playingPart }) => {
			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Previous ${label}`,
					short: `⏮${label}`,
				},
				info: {
					long: [playingPart.part.resolved.label, formatKeyTimeToEnd(longestDuration)].join('\n'),
				},
			}
		},
	})
}
export function keyDisplayApplicationDelete(
	firstAction: ApplicationAction,
	actions: ActionAny[],
	triggerArea: TriggerArea | undefined
): KeyDisplayTimeline {
	const label = getSelectionLabel(firstAction)

	return _getKeyDisplay(actions, {
		idle:
			firstAction.selected.length > 0
				? {
						attentionLevel: AttentionLevel.NEUTRAL,
						area: triggersAreaToArea(triggerArea, false),
						header: {
							long: `Delete ${label}`,
							short: `🗑${label}`,
						},
					}
				: {
						// Nothing to Delete:
						attentionLevel: AttentionLevel.IGNORE,
						area: triggersAreaToArea(triggerArea, false),

						header: {
							long: `Delete`,
							short: `🗑`,
						},
					},
		playing: () => {
			return null
		},
	})
}

function getSelectionLabel(firstAction: ApplicationAction, groupOnly = false): string {
	const labels: string[] = []
	let partCount = 0
	let groupCount = 0

	for (const selected of firstAction.selected) {
		if (selected.type === 'group') {
			groupCount++
			labels.push(selected.group.name)
		} else if (selected.type === 'part') {
			if (!groupOnly) {
				partCount++
				labels.push(selected.part.resolved.label)
			}
		} else assertNever(selected)
	}

	if (labels.length === 0) return ''
	else if (labels.length === 1) return labels[0]
	else if (partCount === 0 && groupCount > 0) return `${groupCount} Groups`
	else if (groupCount === 0 && partCount > 0) return `${partCount} Parts`
	else if (groupCount > 0 && partCount > 0) return `${partCount} things`
	else if (groupCount === 0 && partCount === 0) return ''
	// Won't really ever happen
	else return `N/A`
}
function isThisSelected(action: ActionAny, group: GroupBase, playingPart: GroupPreparedPlayDataPart): boolean {
	// Only show the playing state while OUR part is playing:
	if (action.type === 'rundown') {
		if (action.part.id !== playingPart.part.id) return false
	} else if (action.type === 'application') {
		if (!partIsSelected(action.selected, playingPart.part.id) && !groupIsSelected(action.selected, group.id))
			return false
	} else assertNever(action)

	return true
}
