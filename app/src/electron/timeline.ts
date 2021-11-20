import { prepareGroupPlayhead } from '@/lib/playhead'
import { findRundown, hashObj } from '@/lib/util'
import { AppModel } from '@/models/AppModel'
import { RundownModel } from '@/models/RundownModel'
import { TimelineObject } from 'superfly-timeline'
import { DeviceType, TimelineObjEmpty, TSRTimelineObjBase } from 'timeline-state-resolver-types'
import { TsrBridgeApi } from './api/TsrBridge'

export interface UpdateTimelineCache {
	groupHashes?: { [groupId: string]: string }
	mappingsHash?: string
}

export async function updateTimeline(cache: UpdateTimelineCache, appData: AppModel) {
	let groupsToPlay: TimelineObjEmpty[] = []

	for (const group of appData.groups) {
		const groupPlayhead = prepareGroupPlayhead(group)

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

			// First, add the rundowns that doesn't loop:
			for (const rundown of groupPlayhead.rundowns) {
				// Add the rundown to the timeline:
				let obj: TimelineObjEmpty | null = rundownToTimelineObj(rundown.rundown, rundown.startTime)
				timelineGroup.children?.push(obj)
			}

			// Then add the rundowns that loop:
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
				for (const rundown of groupPlayhead.repeating.rundowns) {
					// Add the rundown to the timeline:
					let obj: TimelineObjEmpty | null = rundownToTimelineObj(rundown.rundown, rundown.startTime)
					// We have to modify the ids so that they won't collide with the previous ones:
					changeTimelineId(obj, (id) => `${id}_2`)
					repeatingObj.children?.push(obj)
				}
				timelineGroup.children?.push(repeatingObj)
			}

			groupsToPlay.push(timelineGroup)
		}
	}

	if (!cache.groupHashes) cache.groupHashes = {}

	const mappingsHash = hashObj(appData.mappings)
	if (cache.mappingsHash !== mappingsHash) {
		cache.mappingsHash = mappingsHash

		// The mappings have changed, send updates to TSR:
		const res = await TsrBridgeApi.updateMappings({
			mappings: appData.mappings,
		})
	}

	// Added/modified:
	const existing: { [id: string]: true } = {}
	for (const obj of groupsToPlay) {
		existing[obj.id] = true

		const hash = hashObj(obj)

		if (cache.groupHashes[obj.id] !== hash) {
			cache.groupHashes[obj.id] = hash

			// The timeline objects have changed, send updates to TSR:
			const res = await TsrBridgeApi.playTimeline({
				id: obj.id,
				timeline: [obj],
			})
			// const startedTime = res.data
			// event.returnValue = startedTime
		}
	}
	// Removed:
	for (const existingId of Object.keys(cache.groupHashes)) {
		if (!existing[existingId]) {
			delete cache.groupHashes[existingId]

			// The timeline objects doesn't exist anymore, send updates to TSR:
			const res = await TsrBridgeApi.stopTimeline({
				id: existingId,
			})
		}
	}
}
function rundownToTimelineObj(rundown: RundownModel, startTime: number): TimelineObjEmpty {
	const timelineObj: TimelineObjEmpty = {
		id: rundown.id,
		enable: {
			start: startTime,
			duration: rundown.resolved.duration,
		},
		layer: '',
		content: {
			deviceType: DeviceType.ABSTRACT,
			type: 'empty',
		},
		classes: [],
		isGroup: true,
		children: JSON.parse(JSON.stringify(rundown.timeline)), // clone
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
