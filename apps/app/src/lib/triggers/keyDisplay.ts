import { KeyDisplay, KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { Action } from './action'
import { Part } from '../../models/rundown/Part'
import { getTimelineForGroup } from '../../electron/timeline'
import { Group } from '../../models/rundown/Group'

/** Return a KeyDisplay for a button */
export function getKeyDisplayForButtonActions(actionsOnButton: Action[] | undefined): KeyDisplayTimeline | KeyDisplay {
	if (actionsOnButton && actionsOnButton.length) {
		const firstAction = actionsOnButton[0]

		if (firstAction.trigger.action === 'play') {
			return playKeyDisplay(actionsOnButton)
		} else if (firstAction.trigger.action === 'stop') {
			return stopKeyDisplay(actionsOnButton)
		} else if (firstAction.trigger.action === 'playStop') {
			return playStopKeyDisplay(actionsOnButton)
		} else {
			assertNever(firstAction.trigger.action)
			return []
		}
	} else {
		// is not used anywhere
		return idleKeyDisplay()
	}
}

export function idleKeyDisplay(): KeyDisplayTimeline {
	return [
		{
			id: 'idle_not_assigned',
			layer: 'KEY',
			enable: { while: 1 },
			content: {
				attentionLevel: AttentionLevel.IGNORE,
			},
		},
	]
}

export function playKeyDisplay(actions: Action[]): KeyDisplayTimeline {
	const longestDuration: number = actions.reduce((max, action) => Math.max(max, action.part.resolved.duration), 0)
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,

			header: {
				long: `Play ${action0.part.name}`,
				short: `▶${action0.part.name.slice(-7)}`,
			},
			info: {
				long: `#duration(${longestDuration})`,
			},
		},
		playing: (data) => {
			// Only show the playing state while OUR part is playing
			if (data.action.part.id !== data.part.id) return null

			const label = action0.part.name
			return {
				attentionLevel: AttentionLevel.INFO,

				header: {
					long: `Play ${label}`,
					short: `▶${label.slice(-7)}`,
				},
				info: {
					long: `#timeToEnd`,
				},
			}
		},
	})
}

export function stopKeyDisplay(actions: Action[]): KeyDisplayTimeline {
	const longestDuration: number = actions.reduce((max, action) => Math.max(max, action.part.resolved.duration), 0)
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,

			header: {
				long: `Stop ${getLabel(actions, action0.part)}`,
				short: `⏹${getLabel(actions, action0.part).slice(-7)}`,
			},
			info: {
				long: `#duration(${longestDuration})`,
			},
		},
		playing: (data) => {
			// Only show the playing state while OUR part is playing:
			if (!data.group.oneAtATime && data.action.part.id !== data.part.id) return null
			const label = getLabel(actions, data.part)
			return {
				attentionLevel: AttentionLevel.INFO,

				header: {
					long: `Stop ${label}`,
					short: `⏹${label.slice(-7)}`,
				},
				info: {
					long: `${data.part.name}\n#timeToEnd`,
				},
			}
		},
	})
}
export function playStopKeyDisplay(actions: Action[]): KeyDisplayTimeline {
	const longestDuration: number = actions.reduce((max, action) => Math.max(max, action.part.resolved.duration), 0)
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,

			header: {
				long: `Play ${action0.part.name}`,
				short: `▶${action0.part.name.slice(-7)}`,
			},
			info: {
				long: `#duration(${longestDuration})`,
			},
		},
		playing: (data) => {
			// Only show the playing state while OUR part is playing:
			if (!data.group.oneAtATime && data.action.part.id !== data.part.id) return null
			const label = getLabel(actions, data.part)
			return {
				attentionLevel: AttentionLevel.INFO,

				header: {
					long: `Stop ${label}`,
					short: `⏹${label.slice(-7)}`,
				},
				info: {
					long: `${data.part.name}\n#timeToEnd`,
				},
			}
		},
	})
}

function getLabel(actions: Action[], part: Part) {
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	let actionsAreInSameGroup = true
	let groupId = ''
	for (const action of actions) {
		if (!groupId) {
			groupId = action.group.id
		} else if (groupId !== action.group.id) {
			actionsAreInSameGroup = false
			break
		}
	}
	if (actionsAreInSameGroup && action0.group.oneAtATime) {
		return action0.group.name
	} else if (actions.length > 1) {
		return `#${actions.length}`
	} else {
		return part.name
	}
}

export function _getKeyDisplay(
	actions: Action[],
	labels: {
		idle: KeyDisplay
		playing: (data: { group: Group; part: Part; action: Action }) => KeyDisplay | null
	}
): KeyDisplayTimeline {
	if (actions.length === 0) throw new Error('Actions array is empty')

	const keyTimeline: KeyDisplayTimeline = []

	for (const action of actions) {
		// The idea here is to use the same logic for timeline generation as playout, but instead of
		// playout-content, we fill it with key-display contents, that are to be sent to the keys.
		// That way the peripherals will stay in sync with the playout and GUI.

		const tl = getTimelineForGroup(action.group, action.group.preparedPlayData, (part: Part, parentId: string) => {
			// return content for the part

			// if (action.part.id !== part.id) return []

			const content = labels.playing({
				group: action.group,
				part: part,
				action: action,
			})

			if (!content) return []

			const id = `playing_${parentId}`
			return [
				{
					id: id,
					layer: 'KEY',
					priority: 0, // so it will show the one which ends first, first
					enable: {
						start: `#${parentId}.start`,
						end: `#${parentId}.end`,
					},
					content: content,
					keyframes: [
						{
							id: `${id}_kf_end`,
							enable: {
								// Notify when it is 5 seconds left
								start: `#${parentId}.end - 5000`,
								end: `#${parentId}.end`,
							},
							content: {
								attentionLevel: AttentionLevel.NOTIFY,
							},
						},
					],
				},
			]
		}) as unknown as KeyDisplayTimeline

		if (tl) keyTimeline.push(...tl)
	}

	keyTimeline.push({
		id: 'idle',
		layer: 'KEY',
		priority: -1,
		enable: { while: 1 },
		content: labels.idle,
	})

	return keyTimeline
}
