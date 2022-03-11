import { prepareGroupPlayData } from '../lib/playhead'
import { Group } from '../models/rundown/Group'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { Part } from '../models/rundown/Part'
import { TimelineObject } from 'superfly-timeline'
import { DeviceType, TimelineObjEmpty, TSRTimeline, TSRTimelineObjBase } from 'timeline-state-resolver-types'
import { StorageHandler } from './storageHandler'
import { BridgeHandler } from './bridgeHandler'
import { deepClone } from '@shared/lib'

export interface UpdateTimelineCache {
	groupHashes?: { [groupId: string]: string }
	mappingsHash?: string
}

export function updateTimeline(
	cache: UpdateTimelineCache,
	storage: StorageHandler,
	bridgeHandler: BridgeHandler,
	group: Group
): GroupPreparedPlayData | null {
	const prepared = prepareGroupPlayData(group)
	const timeline = getTimelineForGroup(group, prepared, undefined) as TSRTimeline

	bridgeHandler.updateTimeline(group.id, timeline)

	const project = storage.getProject()
	bridgeHandler.updateMappings(project.mappings)

	return prepared || null
}

export function getTimelineForGroup(
	group: Group,
	prepared: GroupPreparedPlayData | null,
	customPartContent: CustomPartConent | undefined
): TimelineObject[] | null {
	const idCount = new Map<string, number>()
	const makeUniqueId = (id: string): string => {
		const count = idCount.get(id) || 0
		idCount.set(id, count + 1)
		return `${id}_${count}`
	}
	const getUniqueId = (id: string): string => {
		const count = idCount.get(id) || 0
		idCount.set(id, count + 1)

		if (count === 0) return id
		else return `${id}_${count}`
	}

	if (prepared) {
		const timeline: TSRTimeline = []

		if (prepared.type === 'single') {
			/** (unix timestamp) */
			const groupStartTime = prepared.startTime

			const timelineGroup: TimelineObjEmpty = {
				id: `group_${group.id}`,
				enable: {
					start: groupStartTime,
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
			for (const playingPart of prepared.parts) {
				// Add the part to the timeline:
				const obj: TimelineObjEmpty | null = partToTimelineObj(
					makeUniqueId(playingPart.part.id),
					playingPart.part,
					playingPart.startTime - groupStartTime,
					customPartContent
				)

				changeTimelineId(obj, (id) => getUniqueId(id))
				timelineGroup.children?.push(obj)
			}

			// Then add the parts that loop:
			if (prepared.repeating) {
				/** Repeating start time, relative to groupStartTime */
				const repeatingStartTime = prepared.duration
				/** unit timestamp */
				const repeatingStartTimeUnix = repeatingStartTime + groupStartTime

				const repeatingObj: TimelineObjEmpty = {
					id: `repeating_${group.id}`,
					enable: {
						start: repeatingStartTime,
						duration: prepared.repeating.duration,
						repeating: prepared.repeating.duration,
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
				for (const part of prepared.repeating.parts) {
					// Add the part to the timeline:
					const obj: TimelineObjEmpty | null = partToTimelineObj(
						makeUniqueId(part.part.id),
						part.part,
						part.startTime - repeatingStartTimeUnix,
						customPartContent
					)
					// We have to modify the ids so that they won't collide with the previous ones:
					changeTimelineId(obj, (id) => getUniqueId(id))
					repeatingObj.children?.push(obj)
				}
				timelineGroup.children?.push(repeatingObj)
			}

			timeline.push(timelineGroup)
		} else if (prepared.type === 'multi') {
			/** (unix timestamp) */
			// const groupStartTime = prepared.startTime

			const timelineGroup: TimelineObjEmpty = {
				id: `group_${group.id}`,
				enable: {
					start: 0,
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
			// Add the parts that doesn't loop:
			for (const playingPart of Object.values(prepared.parts)) {
				// Add the part to the timeline:
				const obj: TimelineObjEmpty | null = partToTimelineObj(
					makeUniqueId(playingPart.part.id),
					playingPart.part,
					playingPart.startTime,
					customPartContent
				)

				changeTimelineId(obj, (id) => getUniqueId(id))
				timelineGroup.children?.push(obj)
			}

			timeline.push(timelineGroup)
		}

		return timeline
	} else {
		return null
	}
}
function partToTimelineObj(
	objId: string,
	part: Part,
	startTime: number,
	customPartContent: CustomPartConent | undefined
): TimelineObjEmpty {
	const timelineObj: TimelineObjEmpty = {
		id: objId,
		enable: {
			start: startTime,
			duration: part.resolved.duration,
			repeating: part.loop ? part.resolved.duration : undefined,
		},
		layer: '',
		content: {
			deviceType: DeviceType.ABSTRACT,
			type: 'empty',
		},
		classes: [],
		isGroup: true,

		children: customPartContent ? customPartContent(part, objId) : part.timeline.map((o) => deepClone(o.obj)),
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

type CustomPartConent = (part: Part, parentId: string) => TimelineObject[]
