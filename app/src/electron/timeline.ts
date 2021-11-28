import { prepareGroupPlayhead } from '@/lib/playhead'
import { findGroup, findPart, hashObj } from '@/lib/util'
import { AppModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { GroupPreparedPlayheadData } from '@/models/PlayheadData'
import { PartModel } from '@/models/PartModel'
import { TimelineObject } from 'superfly-timeline'
import { DeviceType, TimelineObjEmpty, TSRTimelineObjBase } from 'timeline-state-resolver-types'
import { TsrBridgeApi } from './api/TsrBridge'

export interface UpdateTimelineCache {
	groupHashes?: { [groupId: string]: string }
	mappingsHash?: string
}

export function updateTimeline(
	cache: UpdateTimelineCache,
	appData: AppModel,
	group: GroupModel
): GroupPreparedPlayheadData | null {
	const groupPlayhead = prepareGroupPlayhead(group)

	const idCount = new Map<string, number>()
	const getUniqueId = (id: string): string => {
		const count = idCount.get(id) || 0
		idCount.set(id, count + 1)
		return `${id}:${count}`
	}

	if (groupPlayhead) {
		const timelineGroup: TimelineObjEmpty = {
			id: `group_${group.id}`,
			enable: {
				start: groupPlayhead.startTime,
			},
			layer: '',
			content: {
				deviceType: DeviceType.ABSTRACT,
				type: 'empty',
			},
			classes: [],
			isGroup: true,
			children: [],
		}

		// First, add the parts that doesn't loop:
		for (const part of groupPlayhead.parts) {
			// Add the part to the timeline:
			let obj: TimelineObjEmpty | null = partToTimelineObj(part.part, part.startTime)

			changeTimelineId(obj, (id) => getUniqueId(id))
			timelineGroup.children?.push(obj)
		}

		// Then add the parts that loop:
		if (groupPlayhead.repeating) {
			const repeatingObj: TimelineObjEmpty = {
				id: `repeating_${group.id}`,
				enable: {
					start: groupPlayhead.duration,
					duration: groupPlayhead.repeating.duration,
					repeating: groupPlayhead.repeating.duration,
				},
				layer: '',
				content: {
					deviceType: DeviceType.ABSTRACT,
					type: 'empty',
				},
				classes: [],
				isGroup: true,
				children: [],
			}
			for (const part of groupPlayhead.repeating.parts) {
				// Add the part to the timeline:
				let obj: TimelineObjEmpty | null = partToTimelineObj(part.part, part.startTime)
				// We have to modify the ids so that they won't collide with the previous ones:
				changeTimelineId(obj, (id) => getUniqueId(id))
				repeatingObj.children?.push(obj)
			}
			timelineGroup.children?.push(repeatingObj)
		}

		// Send updates to TSR:
		TsrBridgeApi.playTimeline({
			id: group.id,
			timeline: [timelineGroup],
		}).catch(console.error)
	} else {
		// The timeline objects doesn't exist anymore, send updates to TSR:
		TsrBridgeApi.stopTimeline({
			id: group.id,
		}).catch(console.error)
	}

	// This is a hack to make TSR able to survive a restart. We should handle this better in the future.
	const HACK_ALLWAYS_SEND_MAPPINGS = true

	// Check if the meppings need to be re-rent:
	const mappingsHash = hashObj(appData.mappings)
	if (cache.mappingsHash !== mappingsHash || HACK_ALLWAYS_SEND_MAPPINGS) {
		cache.mappingsHash = mappingsHash

		// The mappings have changed, send updates to TSR:
		TsrBridgeApi.updateMappings({
			mappings: appData.mappings,
		}).catch(console.error)
	}

	return groupPlayhead || null
}
function partToTimelineObj(part: PartModel, startTime: number): TimelineObjEmpty {
	const timelineObj: TimelineObjEmpty = {
		id: part.id,
		enable: {
			start: startTime,
			duration: part.resolved.duration,
		},
		layer: '',
		content: {
			deviceType: DeviceType.ABSTRACT,
			type: 'empty',
		},
		classes: [],
		isGroup: true,
		children: JSON.parse(JSON.stringify(part.timeline)), // clone
	}

	return timelineObj
}
function changeTimelineId(obj: TSRTimelineObjBase, changeId: (id: string) => string) {
	const changedIds = new Map<string, string>()

	changeTimelineIdInner(changedIds, obj, changeId)

	// TODO: step 2: update references in the timeline
	// TODO....
}
function changeTimelineIdInner(changedIds: Map<string, string>, obj: TimelineObject, changeId: (id: string) => string) {
	const newId = changeId(obj.id)
	obj.id = newId
	changedIds.set(obj.id, newId)

	if (obj.children) {
		for (const child of obj.children) {
			changeTimelineIdInner(changedIds, child, changeId)
		}
	}
	// if (obj.keyframes) {
	// 	for (const keyframe of obj.keyframes) {
	// 		changeTimelineIdInner(changedIds, keyframe, changeId)
	// 	}
	// }
}
