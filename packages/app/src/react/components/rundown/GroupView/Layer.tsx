import classNames from 'classnames'
import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TimelineObj } from '@/models/rundown/TimelineObj'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { IPCServerContext } from '../../../contexts/IPCServer'
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
}> = ({ rundownId, layerId, groupId, partId, objectsOnLayer, partDuration }) => {
	const ipcServer = useContext(IPCServerContext)
	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: DragItemTypes.RESOURCE_ITEM,
			drop: (item: ResourceDragItem) => {
				ipcServer
					.addResourceToTimeline({
						rundownId,
						groupId,
						partId,
						layerId,
						resourceId: item.resource.id,
					})
					.catch(console.error)
			},
			collect: (monitor) => ({
				isOver: !!monitor.isOver(),
			}),
		}),
		[]
	)

	return (
		<div ref={drop} className={classNames('layer', { isOver })}>
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
						></TimelineObject>
					)
				})}
			</div>
		</div>
	)
}
