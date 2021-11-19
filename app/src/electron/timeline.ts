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
		if (group.playing) {
			const timelineGroup: TimelineObjEmpty = {
				id: group.id,
				enable: {
					start: group.playing.startTime,
					// duration: maxDuration,
					// repeating: maxDuration,
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

			const startRundown = findRundown(group, group.playing.startRundownId)
			if (!startRundown) continue

			// Add the rundown to the timeline:
			let obj: TimelineObjEmpty | null = rundownToTimelineObj(startRundown, null)
			timelineGroup.children?.push(obj)

			if (group.autoPlay) {
				// Add the rest of the rundowns in the group to the timeline:
				const startRundownIndex = group.rundowns.findIndex((r) => r.id === startRundown.id)
				const restRundowns = group.rundowns.slice(startRundownIndex + 1)

				for (const rundown of restRundowns) {
					obj = rundownToTimelineObj(rundown, obj)
					timelineGroup.children?.push(obj)
				}
			}

			if (group.loop) {
				// Add all rundowns in the group to the timeline, for looping:

				const totalDuration = group.rundowns.reduce((acc, r) => acc + r.resolved.duration, 0)

				const repeatingObj: TimelineObjEmpty = {
					id: `${group.id}_repeating`,
					enable: {
						start: `#${obj.id}.end`,
						duration: totalDuration,
						repeating: totalDuration,
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

				obj = null
				for (const rundown of group.rundowns) {
					obj = rundownToTimelineObj(rundown, obj)
					changeTimelineId(obj, (id) => {
						return `${id}_2`
					})

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
function rundownToTimelineObj(rundown: RundownModel, prev: TimelineObjEmpty | null): TimelineObjEmpty {
	const timelineObj: TimelineObjEmpty = {
		id: rundown.id,
		enable: {
			start: prev ? `#${prev.id}.end` : 0,
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
