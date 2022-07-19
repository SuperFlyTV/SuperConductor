import { compact } from 'lodash'
import { ResolvedTimeline, ResolvedTimelineObject } from 'superfly-timeline'
import { Mappings } from 'timeline-state-resolver-types'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { sortMappings } from './TSRMappings'

export function sortLayers(layers: ResolvedTimeline['layers'], mappings: Mappings): SortedLayer[] {
	const usedMappings: Mappings = {}

	for (const layerId of Object.keys(layers)) {
		const mapping = mappings[layerId]
		if (mapping) usedMappings[layerId] = mapping
	}

	return sortMappings(usedMappings).map(({ layerId }) => ({ layerId, objectIds: layers[layerId] }))
}
interface SortedLayer {
	layerId: string
	objectIds: string[]
}
export function timelineObjsOntoLayers(
	sortedLayers: SortedLayer[],
	resolvedTimeline: ResolvedTimeline,
	timeline: TimelineObj[]
) {
	return sortedLayers.map(({ layerId, objectIds }) => {
		const objectsOnLayer: {
			resolved: ResolvedTimelineObject['resolved']
			timelineObj: TimelineObj
		}[] = compact(
			objectIds.map((objectId) => {
				const resolvedObj = resolvedTimeline.objects[objectId]
				const timelineObj = timeline.find((obj) => obj.obj.id === objectId)

				if (resolvedObj && timelineObj) {
					return {
						resolved: resolvedObj.resolved,
						timelineObj: timelineObj,
					}
				}
			})
		)
		return {
			layerId,
			objectsOnLayer,
		}
	})
}

export function getLastEndTime(
	partTimeline: TimelineObj[],
	layerId?: string
): {
	time: number
	objId: string | undefined
} {
	let lastEndTime = 0
	let lastEndObjId: string | undefined = undefined
	for (const o of partTimeline) {
		if (layerId === undefined || o.obj.layer === layerId) {
			const endTime = getTimelineObjEndTime(o)
			if (endTime >= lastEndTime) {
				lastEndTime = endTime
				lastEndObjId = o.obj.id
			}
		}
	}
	return {
		time: lastEndTime,
		objId: lastEndObjId,
	}
}
export function getTimelineObjEndTime(obj: TimelineObj): number {
	let endTime = 0
	for (const instance of obj.resolved.instances) {
		if (instance.end && instance.end > endTime) {
			endTime = instance.end
		}
	}
	return endTime
}
export function getTimelineObjStartTime(obj: TimelineObj): number {
	let startTime: number | undefined = undefined
	for (const instance of obj.resolved.instances) {
		if (startTime === undefined || instance.start < startTime) {
			startTime = instance.start
		}
	}
	if (startTime === undefined) startTime = 0
	return startTime
}
