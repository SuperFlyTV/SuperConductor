import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { Mapping } from 'timeline-state-resolver-types'
import { filterMapping } from '../../../../lib/TSRMappings'
import { allowAddingResourceToLayer } from '../../../../lib/util'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ProjectContext } from '../../../contexts/Project'
import { useMemoArray } from '../../../mobx/lib'
import { DropZone } from '../../util/DropZone'
import { TimelineObject } from './TimelineObject'
import { protectString } from '@shared/models'
import { areInstancesOverlapping } from '../../../../lib/timeline'

export const Layer: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	objectsOnLayer: {
		resolved: ResolvedTimelineObject['resolved']
		timelineObj: TimelineObj
	}[]
	layerId: string
	partDuration: number
	msPerPixel: number
	locked?: boolean
	mapping: Mapping | undefined
}> = ({ rundownId, layerId, groupId, partId, objectsOnLayer, partDuration, msPerPixel, locked, mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const project = useContext(ProjectContext)

	const [{ isOver }, drop] = useDrop(
		// Use case: Drag Resources over this Layer, to insert them as TimelineObjects at this Layer
		() => ({
			accept: locked ? [] : DragItemTypes.RESOURCE_ITEM,
			canDrop: (item) => {
				return (
					typeof mapping !== 'undefined' &&
					item.resources.length >= 1 &&
					allowAddingResourceToLayer(project, item.resources[0], mapping)
				)
			},
			drop: (item: ResourceDragItem) => {
				ipcServer
					.addResourcesToTimeline({
						rundownId,
						groupId,
						partId,
						layerId,
						resourceIds: item.resources.map((r) => r.id),
					})
					.catch(handleError)
			},
			collect: (monitor) => ({
				isOver: monitor.isOver() && monitor.canDrop(),
			}),
		}),
		[]
	)

	// Optimization:
	const objectsOnLayerWithWarnings = useMemoArray(() => {
		// Prepare: Find overlapping objects/instances:
		const overlappingObjects = new Set<string>()
		for (const objA of objectsOnLayer) {
			if (overlappingObjects.has(objA.timelineObj.obj.id)) continue

			for (const instanceA of objA.resolved.instances) {
				if (overlappingObjects.has(objA.timelineObj.obj.id)) continue

				for (const objB of objectsOnLayer) {
					if (objB === objA) continue
					if (overlappingObjects.has(objA.timelineObj.obj.id)) continue

					for (const instanceB of objB.resolved.instances) {
						if (areInstancesOverlapping(instanceA, instanceB)) {
							overlappingObjects.add(objA.timelineObj.obj.id)
							overlappingObjects.add(objB.timelineObj.obj.id)
							break
						}
					}
				}
			}
		}

		return objectsOnLayer.map((objectOnLayer) => {
			const warnings = []
			const overlapping = overlappingObjects.has(objectOnLayer.timelineObj.obj.id)

			if (typeof mapping !== 'undefined' && !filterMapping(mapping, objectOnLayer.timelineObj.obj)) {
				warnings.push('This object is not allowed on this layer type.')
			}

			if (typeof mapping === 'undefined') {
				warnings.push(`The layer "${layerId}" could not be found.`)
			}

			if (overlapping) {
				warnings.push('This object overlaps another object on the same layer.')
			}

			return {
				objectOnLayer,
				warnings,
				overlapping,
			}
		})
	}, [objectsOnLayer])

	return (
		<DropZone ref={drop} className="layer" isOver={isOver} data-layer-id={layerId}>
			<div className="layer__content">
				{objectsOnLayerWithWarnings.map(({ objectOnLayer, warnings, overlapping }) => {
					return (
						<TimelineObject
							key={objectOnLayer.timelineObj.obj.id}
							groupId={groupId}
							partId={partId}
							timelineObj={objectOnLayer.timelineObj}
							resolved={objectOnLayer.resolved}
							partDuration={partDuration}
							msPerPixel={msPerPixel}
							locked={locked}
							warnings={warnings}
							overlapping={overlapping}
							deviceId={protectString(mapping?.deviceId)}
						></TimelineObject>
					)
				})}
			</div>
		</DropZone>
	)
}
/** Analogue to Layer, used in initial-renders */
export function LayerEmpty(): JSX.Element {
	return (
		<div className="layer">
			<div className="layer__content" />
		</div>
	)
}
