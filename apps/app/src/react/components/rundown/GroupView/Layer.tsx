import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DropZone } from '../../util/DropZone'
import { TimelineObject } from './TimelineObject'

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
}> = ({ rundownId, layerId, groupId, partId, objectsOnLayer, partDuration, msPerPixel, locked }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: locked ? [] : DragItemTypes.RESOURCE_ITEM,
			drop: (item: ResourceDragItem) => {
				ipcServer
					.addResourceToTimeline({
						rundownId,
						groupId,
						partId,
						layerId,
						resourceId: item.resource.id,
					})
					.catch(handleError)
			},
			collect: (monitor) => ({
				isOver: !!monitor.isOver(),
			}),
		}),
		[]
	)

	return (
		<DropZone ref={drop} className="layer" isOver={isOver} data-layer-id={layerId}>
			<div className="layer__content">
				{objectsOnLayer.map((objectOnLayer) => {
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
						></TimelineObject>
					)
				})}
			</div>
		</DropZone>
	)
}
