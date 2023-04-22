import { KeyDisplay, KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever } from '@shared/lib'
import { ActionAny, ApplicationActionSelected } from '../action'
import { GroupBase } from '../../../models/rundown/Group'
import { GroupPreparedPlayDataPart } from '../../../models/GUI/PreparedPlayhead'
import { PeripheralArea } from '../../../models/project/Peripheral'
import { getTimelineForGroup } from '../../timeline'
import { TimelineObject } from 'superfly-timeline'

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
		} else if (action.type === 'application') {
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
/**
 * This function is used to return a Timeline for a Key.
 * The Timeline is used to present current (and possibly future) content on a certain Key.
 */
export function _getKeyDisplay(
	/** The actions contain a list of all of the actions that the key is assigned to */
	actions: ActionAny[],
	labels: {
		/** Return content for when nothing related to the action(s) is playing */
		idle: KeyDisplay
		/** Return content for when the playingPart is PAUSED */
		paused?: (data: {
			group: GroupBase
			action: ActionAny
			pausedPart: GroupPreparedPlayDataPart
		}) => KeyDisplay | null
		/** Return content for when the playingPart is PLAYING */
		playing: (data: {
			group: GroupBase
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
		} else if (action.type === 'application') {
			// In the case of an application-action,
			// several things could have been selected in the GUI
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

						let content: KeyDisplay | null = null
						if (isPaused) {
							// The part is paused
							content =
								labels.paused?.({
									group: currentGroup,
									action: action,
									pausedPart: playingPart,
								}) ?? labels.idle
						} else {
							content = labels.playing({
								group: currentGroup,
								action: action,
								playingPart,
							})
						}

						if (!content) return []

						const id = `playing_${parentId}`
						const timeline: TimelineObject[] = [
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
						return timeline
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

	// Also add a timeline-object with lowest priority,
	// which will be used whenever nothing else plays:
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
export function partIsSelected(selected: ApplicationActionSelected[], partId: string): boolean {
	for (const s of selected) {
		if (s.type === 'part' && s.part.id === partId) return true
	}
	return false
}
export function groupIsSelected(selected: ApplicationActionSelected[], groupId: string): boolean {
	for (const s of selected) {
		if (s.type === 'group' && s.group.id === groupId) return true
		// Note: If a Part is selected, it is ignored
	}
	return false
}
export function formatKeyDuration(duration: number | null | undefined): string {
	if (duration === null) return '∞'
	if (!duration) return ''
	return `#duration(${duration})`
}
export function formatKeyTimeToEnd(duration: number | null | undefined): string {
	if (duration === null) return '∞'
	return '#timeToEnd'
}
