import { prepareGroupPlayData } from '../lib/playhead'
import { Group, GroupBase } from '../models/rundown/Group'
import {
	GroupPreparedPlayData,
	GroupPreparedPlayDataPart,
	GroupPreparedPlayDataSection,
} from '../models/GUI/PreparedPlayhead'
import { Part } from '../models/rundown/Part'
import { TimelineEnable, TimelineObject } from 'superfly-timeline'
import { DeviceType, TimelineObjEmpty, TSRTimeline, TSRTimelineObjBase } from 'timeline-state-resolver-types'
import { StorageHandler } from './storageHandler'
import { BridgeHandler } from './bridgeHandler'
import { deepClone, ensureArray } from '@shared/lib'
import { modifyTimelineObjectForPlayout } from '../lib/TimelineObj'

const queuedUpdateTimelines = new Map<string, NodeJS.Timeout>()

export function updateTimeline(
	storage: StorageHandler,
	bridgeHandler: BridgeHandler,
	group: Group
): GroupPreparedPlayData | null {
	const prepared = prepareGroupPlayData(group)

	// Defer update, to allow for multiple updates to be batched together:
	const existingTimeout = queuedUpdateTimelines.get(group.id)
	if (existingTimeout) clearTimeout(existingTimeout)

	queuedUpdateTimelines.set(
		group.id,
		setTimeout(() => {
			const queued = queuedUpdateTimelines.get(group.id)
			if (!queued) return
			queuedUpdateTimelines.delete(group.id)

			const timeline = getTimelineForGroup(group, prepared, undefined) as TSRTimeline
			bridgeHandler.updateTimeline(group.id, timeline)

			const project = storage.getProject()
			bridgeHandler.updateMappings(project.mappings)
		}, 1)
	)

	return prepared || null
}

export function getTimelineForGroup(
	group: GroupBase,
	prepared: GroupPreparedPlayData | null,
	customPartContent: CustomPartContent | undefined
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
		// console.log('prepared', JSON.stringify(prepared, null, 2))

		if (prepared.type === 'single') {
			let firstStart = Infinity
			let lastEnd = 0
			const children: TimelineObject[] = []
			for (let i = 0; i < prepared.sections.length; i++) {
				const section = prepared.sections[i]
				firstStart = Math.min(section.startTime, firstStart)
				lastEnd = Math.max(section.endTime || Infinity, lastEnd)

				children.push(
					...sectionToTimelineObj(
						section,
						`${group.id}_${i}`,
						group.id,
						makeUniqueId,
						getUniqueId,
						customPartContent
					)
				)
			}

			if (children.length > 0) {
				const timelineGroup: TimelineObjEmpty = {
					id: `group_${group.id}`,
					enable: {
						start: firstStart,
						end: lastEnd === Infinity ? undefined : lastEnd,
					},
					layer: `__group_${group.id}`,
					content: {
						deviceType: DeviceType.ABSTRACT,
						type: 'empty',
					},
					classes: [],
					isGroup: true,
					children,
				}

				// Modify times to be relative to the group:
				for (const obj of children) {
					for (const enable of ensureArray(obj.enable)) {
						if (typeof enable.start === 'number') enable.start -= firstStart
						if (typeof enable.end === 'number') enable.end -= firstStart
					}
				}

				timeline.push(timelineGroup)
			}
		} else if (prepared.type === 'multi') {
			const timelineGroup: TimelineObjEmpty = {
				id: `group_${group.id}`,
				enable: {
					start: 0,
				},
				layer: `__group_${group.id}`,
				content: {
					deviceType: DeviceType.ABSTRACT,
					type: 'empty',
				},
				classes: [],
				isGroup: true,
				children: [],
			}
			for (const [partId, sections] of Object.entries(prepared.sections)) {
				for (let i = 0; i < sections.length; i++) {
					const section = sections[i]

					const children: TimelineObject[] = []
					const timelineGroupPart: TimelineObjEmpty = {
						id: `group_${group.id}_${partId}_${i}`,
						enable: {
							start: 0,
						},
						layer: `__group_${group.id}_${partId}`,
						content: {
							deviceType: DeviceType.ABSTRACT,
							type: 'empty',
						},
						classes: [],
						isGroup: true,
						children,
					}

					children.push(
						...sectionToTimelineObj(
							section,
							`${group.id}_${partId}_${i}`,
							`${group.id}_${partId}`,
							makeUniqueId,
							getUniqueId,
							customPartContent
						)
					)
					if (children.length > 0) {
						timelineGroup.children?.push(timelineGroupPart)
					}
				}
			}
			if ((timelineGroup.children?.length ?? 0) > 0) {
				timeline.push(timelineGroup)
			}
		}
		// console.log('timeline', JSON.stringify(timeline, null, 2))
		return timeline
	} else {
		return null
	}
}
function sectionToTimelineObj(
	section: GroupPreparedPlayDataSection,
	id: string,
	layer: string,
	makeUniqueId: (id: string) => string,
	getUniqueId: (id: string) => string,
	customPartContent: CustomPartContent | undefined
): TSRTimeline {
	const timeline: TSRTimeline = []

	const sectionObj: TimelineObjEmpty = {
		id: `section_${id}`,
		enable: {
			start: section.startTime,
			end: section.endTime ?? undefined,
		},
		layer: layer,
		content: {
			deviceType: DeviceType.ABSTRACT,
			type: 'empty',
		},
		classes: [],
		isGroup: true,
		children: [],
	}
	const sectionContentObj: TimelineObjEmpty = {
		id: `section_content_${id}`,
		enable: {
			start: 0,
			duration: section.repeating
				? section.duration
				: section.endTime !== null
				? section.endTime - section.startTime
				: null,
			repeating: section.repeating ? section.duration : undefined,
		},
		layer: `${layer}_content`,
		content: {
			deviceType: DeviceType.ABSTRACT,
			type: 'empty',
		},
		classes: [],
		isGroup: true,
		children: [],
	}
	sectionObj.children?.push(sectionContentObj)

	for (const part of section.parts) {
		// Add the part to the timeline:
		const obj: TimelineObjEmpty | null = partToTimelineObj(
			makeUniqueId(part.part.id),
			part,
			part.startTime - section.startTime,
			section.pauseTime,
			customPartContent
		)
		// We have to modify the ids so that they won't collide with the previous ones:
		changeTimelineId(obj, (id) => getUniqueId(id))
		sectionContentObj.children?.push(obj)
	}

	if ((sectionContentObj.children?.length ?? 0) > 0) {
		timeline.push(sectionObj)
	}

	return timeline
}
function partToTimelineObj(
	objId: string,
	playingPart: GroupPreparedPlayDataPart,
	startTime: number,
	pauseTime: number | undefined,
	customPartContent: CustomPartContent | undefined
): TimelineObjEmpty {
	const part: Part = playingPart.part

	const enable: TimelineEnable = {
		start: startTime,
		duration: part.resolved.duration,
		repeating: part.loop ? part.resolved.duration : undefined,
	}
	if (pauseTime !== undefined) {
		// is paused
		delete enable.duration
		delete enable.repeating
	}

	const timelineObj: TimelineObjEmpty = {
		id: objId,
		enable,
		layer: '',
		content: {
			deviceType: DeviceType.ABSTRACT,
			type: 'empty',
		},
		classes: [],
		isGroup: true,

		children: customPartContent
			? customPartContent(playingPart, objId, pauseTime !== undefined)
			: part.timeline.map((o) => {
					const partTimelineObj = deepClone(o.obj)
					modifyTimelineObjectForPlayout(partTimelineObj, playingPart, o, pauseTime)
					return partTimelineObj
			  }),
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

type CustomPartContent = (
	playingPart: GroupPreparedPlayDataPart,
	parentId: string,
	isPaused: boolean
) => TimelineObject[]
