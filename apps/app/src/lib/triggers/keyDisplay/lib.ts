import { KeyDisplay, KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { ActionAny, ProjectActionSelected } from '../action'
import { PartBase } from '../../../models/rundown/Part'
import { getTimelineForGroup } from '../../../electron/timeline'
import { GroupBase } from '../../../models/rundown/Group'
import { GroupPreparedPlayDataPart } from '../../../models/GUI/PreparedPlayhead'
import { PeripheralArea } from '../../../models/project/Peripheral'

export type TriggersAreaMap = Map<string, TriggerArea>
export interface TriggerArea {
	areaId: string
	area: PeripheralArea
	keyRank: number
	areaColor: string
}

export function getLongestActionDuration(actions: ActionAny[]): number | null {
	if (actions.length === 0) throw new Error('Actions array is empty')
	let maxDuration: number | null = 0
	for (const action of actions) {
		if (action.type === 'rundown') {
			const duration: number | null = action.part.resolved.duration
			if (duration === null || maxDuration === null) {
				maxDuration = null // Display idle
			} else {
				maxDuration = Math.max(maxDuration, duration)
			}
		} else if (action.type === 'project') {
			for (const selected of action.selected) {
				let duration: number | null | undefined = undefined
				if (selected.type === 'group') {
					duration = undefined // TODO: should it be null here?
				} else if (selected.type === 'part') {
					duration = selected.part.resolved.duration
				} else assertNever(selected)

				if (duration === null || maxDuration === null) {
					maxDuration = null
				} else {
					maxDuration = Math.max(maxDuration, duration ?? 0)
				}
			}
		} else {
			assertNever(action)
		}
	}
	return maxDuration
}

export function _getKeyDisplay(
	actions: ActionAny[],
	labels: {
		idle: KeyDisplay
		/** Return content for when the playingPart is PAUSED */
		paused?: (data: {
			group: GroupBase
			currentPart: PartBase
			action: ActionAny
			playingPart: GroupPreparedPlayDataPart
		}) => KeyDisplay | null
		/** Return content for when the playingPart is PLAYING */
		playing: (data: {
			group: GroupBase
			currentPart: PartBase
			action: ActionAny
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

		const actionGroups: GroupBase[] = []
		if (action.type === 'rundown') {
			actionGroups.push(action.group)
		} else if (action.type === 'project') {
			for (const selected of action.selected) {
				actionGroups.push(selected.group)
			}
		} else assertNever(action)

		for (const actionGroup of actionGroups) {
			// Only check each group once, otherwise getTimelineForGroup() returns non-unique timeline-objects:
			if (groupIds.has(actionGroup.id)) continue
			groupIds.add(actionGroup.id)

			let tl: KeyDisplayTimeline | null
			if (actionGroup) {
				const groupTL = getTimelineForGroup(
					actionGroup,
					actionGroup.preparedPlayData,
					(
						currentGroup: GroupBase,
						playingPart: GroupPreparedPlayDataPart,
						parentId: string,
						isPaused: boolean
					) => {
						// return content for the part

						const currentPart: PartBase = playingPart.part

						let content: KeyDisplay | null = null
						if (isPaused) {
							// The part is paused
							content =
								labels.paused?.({
									group: currentGroup,
									currentPart: currentPart,
									action: action,
									playingPart,
								}) ?? labels.idle
						} else {
							content = labels.playing({
								group: currentGroup,
								currentPart: currentPart,
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
				)
				if (groupTL) {
					tl = groupTL as any[]
				} else {
					tl = null
				}
			} else {
				// TODO: What to display if there's no group?

				tl = null
			}
			if (tl) keyTimeline.push(...tl)
		}
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
export function triggersAreaToArea(
	triggerArea: TriggerArea | undefined,
	areaInDefinition: boolean
): KeyDisplay['area'] {
	if (!triggerArea) return undefined
	return {
		areaInDefinition,
		keyLabel: `${triggerArea.keyRank + 1}`,
		areaLabel: triggerArea.area.name,
		areaId: triggerArea.areaId,
		color: triggerArea.areaColor,
	}
}
export function partIsSelected(selected: ProjectActionSelected[], partId: string): boolean {
	for (const s of selected) {
		if (s.type === 'part' && s.part.id === partId) return true
	}
	return false
}
export function groupIsSelected(selected: ProjectActionSelected[], groupId: string): boolean {
	for (const s of selected) {
		if (s.type === 'group' && s.group.id === groupId) return true
		if (s.type === 'part' && s.group.id === groupId) return true
	}
	return false
}
export function formatKeyDuration(duration: number | null | undefined) {
	if (duration === null) return '∞'
	if (!duration) return ''
	return `#duration(${duration})`
}
export function formatKeyTimeToEnd(duration: number | null | undefined) {
	if (duration === null) return ''
	return '\n#timeToEnd'
}
