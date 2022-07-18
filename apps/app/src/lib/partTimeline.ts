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
