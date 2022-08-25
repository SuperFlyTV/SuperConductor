import { KeyDisplay, KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever, HSVtoRGB, RGBToString } from '@shared/lib'
import { Action } from './action'
import { PartBase } from '../../models/rundown/Part'
import { getTimelineForGroup } from '../../electron/timeline'
import { GroupBase } from '../../models/rundown/Group'
import { GroupPreparedPlayDataPart } from '../../models/GUI/PreparedPlayhead'
import { PeripheralArea } from '../../models/project/Peripheral'
import { Project } from '../../models/project/Project'
import { ActiveTrigger } from '../../models/rundown/Trigger'

export type TriggersAreaMap = Map<string, TriggerArea>
export interface TriggerArea {
	areaId: string
	area: PeripheralArea
	keyRank: number
	areaColor: string
}
export interface DefiningArea {
	bridgeId: string
	deviceId: string
	areaId: string
}

export function prepareTriggersAreaMap(project: Project): TriggersAreaMap {
	const triggersAreaMap = new Map<
		string,
		{
			areaId: string
			area: PeripheralArea
			keyRank: number
			areaColor: string
		}
	>()
	for (const [bridgeId, bridge] of Object.entries(project.bridges)) {
		for (const [deviceId, peripheralSettings] of Object.entries(bridge.peripheralSettings)) {
			let iArea = -1
			for (const [areaId, area] of Object.entries(peripheralSettings.areas)) {
				iArea++

				const notRandom0 = iArea / 6
				const notRandom2 = Math.floor(iArea / 6) * 0.25
				const areaColor = RGBToString(
					HSVtoRGB({
						h: notRandom0 % 1, // 0..1
						s: 1,
						v: 0.25 + (notRandom2 % 1) * 0.5, // 0..0.75
					})
				)

				for (let i = 0; i < area.identifiers.length; i++) {
					const identifier = area.identifiers[i]

					const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`

					triggersAreaMap.set(fullIdentifier, {
						areaId,
						area,
						keyRank: i,
						areaColor,
					})
				}
			}
		}
	}
	return triggersAreaMap
}

/** Return a KeyDisplay for a button */
export function getKeyDisplayForButtonActions(
	trigger: ActiveTrigger,
	triggersAreaMap: TriggersAreaMap,
	definingArea: DefiningArea | null,
	actionsOnButton: Action[] | undefined
): KeyDisplayTimeline | KeyDisplay {
	const triggerArea = triggersAreaMap.get(trigger.fullIdentifier)
	if (definingArea && definingArea.bridgeId === trigger.bridgeId && definingArea.deviceId === trigger.deviceId) {
		// An area is being defined on this peripheral.

		if (triggerArea) {
			// This key is in an area

			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				intercept: 'areaDefine',

				area: triggersAreaToArea(triggerArea, definingArea.areaId === triggerArea.areaId),
			}
		} else {
			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				intercept: 'areaDefine',
			}
		}
	} else {
		if (actionsOnButton && actionsOnButton.length) {
			// There is at least one action on this key

			const firstAction = actionsOnButton[0]

			if (firstAction.trigger.action === 'play') {
				return playKeyDisplay(actionsOnButton, triggerArea)
			} else if (firstAction.trigger.action === 'stop') {
				return stopKeyDisplay(actionsOnButton, triggerArea)
			} else if (firstAction.trigger.action === 'playStop') {
				return playStopKeyDisplay(actionsOnButton, triggerArea)
			} else {
				assertNever(firstAction.trigger.action)
				return []
			}
		} else {
			// This key has no actions
			return idleKeyDisplay(triggerArea)
		}
	}
}

export function idleKeyDisplay(triggerArea: TriggerArea | undefined): KeyDisplayTimeline {
	return [
		{
			id: 'idle_not_assigned',
			layer: 'KEY',
			enable: { while: 1 },
			content: {
				attentionLevel: AttentionLevel.IGNORE,
				area: triggersAreaToArea(triggerArea, false),
			},
		},
	]
}

export function playKeyDisplay(actions: Action[], triggerArea: TriggerArea | undefined): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Play ${action0.part.name}`,
				short: `▶${action0.part.name}`,
			},
			info: {
				long: longestDuration === null ? '-' : `#duration(${longestDuration})`,
			},
		},
		paused: ({ action, part, playingPart }) => {
			// Only show the playing state while OUR part is playing
			if (action.part.id !== part.id) return null

			const label = action0.part.name
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: `#duration(${playingPart.duration})`,
				},
			}
		},
		playing: (data) => {
			// Only show the playing state while OUR part is playing
			if (data.action.part.id !== data.part.id) return null

			const label = action0.part.name
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
export function stopKeyDisplay(actions: Action[], triggerArea: TriggerArea | undefined): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Stop ${getLabel(actions, action0.part)}`,
				short: `⏹${getLabel(actions, action0.part)}`,
			},
			info: {
				long: longestDuration === null ? 'Infinite' : `#duration(${longestDuration})`,
			},
		},
		playing: (data) => {
			// Only show the playing state while OUR part is playing:
			if (!data.group.oneAtATime && data.action.part.id !== data.part.id) return null
			const label = getLabel(actions, data.part)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: `${data.part.name}` + (longestDuration === null ? '' : '\n#timeToEnd'),
				},
			}
		},
	})
}
export function playStopKeyDisplay(actions: Action[], triggerArea: TriggerArea | undefined): KeyDisplayTimeline {
	const longestDuration = getLongestActionDuration(actions)
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]

	return _getKeyDisplay(actions, {
		idle: {
			attentionLevel: AttentionLevel.NEUTRAL,
			area: triggersAreaToArea(triggerArea, false),

			header: {
				long: `Play ${action0.part.name}`,
				short: `▶${action0.part.name}`,
			},
			info: {
				long: longestDuration === null ? '-' : `#duration(${longestDuration})`,
			},
		},
		paused: ({ action, part, playingPart }) => {
			// Only show the playing state while OUR part is playing
			if (action.part.id !== part.id) return null

			const label = action0.part.name
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Play ${label}`,
					short: `▶${label}`,
				},
				info: {
					long: `#duration(${playingPart.duration})`,
				},
			}
		},
		playing: (data) => {
			// Only show the playing state while OUR part is playing
			if (data.action.part.id !== data.part.id) return null

			// Only show the playing state while OUR part is playing:
			// if (!data.group.oneAtATime && data.action.part.id !== data.part.id) return null
			const label = getLabel(actions, data.part)
			return {
				attentionLevel: AttentionLevel.INFO,
				area: triggersAreaToArea(triggerArea, false),

				header: {
					long: `Stop ${label}`,
					short: `⏹${label}`,
				},
				info: {
					long: `${data.part.name}` + (longestDuration === null ? '' : '\n#timeToEnd'),
				},
			}
		},
	})
}

function getLongestActionDuration(actions: Action[]): number | null {
	if (actions.length === 0) throw new Error('Actions array is empty')
	return actions.reduce((max: number | null, action) => {
		if (action.part.resolved.duration === null || max === null) return null
		return Math.max(max, action.part.resolved.duration)
	}, 0)
}

function getLabel(actions: Action[], part: PartBase) {
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
		paused?: (data: {
			group: GroupBase
			part: PartBase
			action: Action
			playingPart: GroupPreparedPlayDataPart
		}) => KeyDisplay | null
		playing: (data: {
			group: GroupBase
			part: PartBase
			action: Action
			playingPart: GroupPreparedPlayDataPart
		}) => KeyDisplay | null
	}
): KeyDisplayTimeline {
	if (actions.length === 0) throw new Error('Actions array is empty')

	const keyTimeline: KeyDisplayTimeline = []

	const groupIds = new Set<string>()

	for (const action of actions) {
		// The idea here is to use the same logic for timeline generation as playout, but instead of
		// playout-content, we fill it with key-display contents, that are to be sent to the keys.
		// That way the peripherals will stay in sync with the playout and GUI.

		// Only check each group once, otherwise getTimelineForGroup() returns non-unique timeline-objects:
		if (groupIds.has(action.group.id)) continue
		groupIds.add(action.group.id)

		const tl = getTimelineForGroup(
			action.group,
			action.group.preparedPlayData,
			(playingPart: GroupPreparedPlayDataPart, parentId: string) => {
				// return content for the part

				const part: PartBase = playingPart.part

				let content: KeyDisplay | null = null
				if (playingPart.pauseTime !== undefined) {
					// The part is paused
					content =
						labels.paused?.({
							group: action.group,
							part: part,
							action: action,
							playingPart,
						}) ?? labels.idle
				} else {
					content = labels.playing({
						group: action.group,
						part: part,
						action: action,
						playingPart,
					})
				}

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
			}
		) as unknown as KeyDisplayTimeline

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
function triggersAreaToArea(triggerArea: TriggerArea | undefined, areaInDefinition: boolean): KeyDisplay['area'] {
	if (!triggerArea) return undefined
	return {
		areaInDefinition,
		keyLabel: `${triggerArea.keyRank + 1}`,
		areaLabel: triggerArea.area.name,
		areaId: triggerArea.areaId,
		color: triggerArea.areaColor,
	}
}
