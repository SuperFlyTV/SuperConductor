import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { Mapping } from 'timeline-state-resolver-types'
import { filterMapping } from '../../../../../../lib/TSRMappings'
import { allowAddingResourceToLayer } from '../../../../../../lib/util'
import { TimelineObj } from '../../../../../../models/rundown/TimelineObj'
import { DragItemTypes, ResourceDragItem } from '../../../../../api/DragItemTypes'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../../contexts/Project'
import { DropZone } from '../../../../util/DropZone'
import { TimelineObjectExpression } from './TimelineObjectExpression'

export const LayerForExpression: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	resolved: ResolvedTimelineObject['resolved']
	timelineObj: TimelineObj
	layerId: string
	locked?: boolean
	mapping: Mapping | undefined
}> = ({ rundownId, layerId, groupId, partId, resolved, timelineObj, locked, mapping }) => {
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

	const warnings = []
	if (typeof mapping !== 'undefined' && !filterMapping(mapping, timelineObj.obj)) {
		warnings.push('This object is not allowed on this layer type.')
	}
	if (typeof mapping === 'undefined') {
		warnings.push(`The layer "${layerId}" could not be found.`)
	}

	return (
		<DropZone ref={drop} className="layer" isOver={isOver} data-layer-id={layerId}>
			<div className="layer__content">
				<TimelineObjectExpression
					groupId={groupId}
					partId={partId}
					timelineObj={timelineObj}
					resolved={resolved}
					locked={locked}
					warnings={warnings}
				/>
			</div>
		</DropZone>
	)
}
/** Analogue to LayerForExpression, used in initial-renders */
export function LayerEmptyForExpression(): JSX.Element {
	return (
		<div className="layer">
			<div className="layer__content" />
		</div>
	)
}
