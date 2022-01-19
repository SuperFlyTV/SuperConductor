import classNames from 'classnames'
import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { TimelineObj } from '@/models/rundown/TimelineObj'
import { ResourceAny } from '../../../../models/resource/resource'
import { ItemTypes } from '../../../api/ItemTypes'
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
	layerName: string
	partDuration: number
}> = ({ rundownId, layerId, layerName, groupId, partId, objectsOnLayer, partDuration }) => {
	const ipcServer = useContext(IPCServerContext)
	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: ItemTypes.RESOURCE_ITEM,
			drop: (item: { resource: ResourceAny }) => {
				ipcServer.addResourceToTimeline({
					rundownId,
					groupId,
					partId,
					layerId,
					resourceId: item.resource.id,
				})
			},
			collect: (monitor) => ({
				isOver: !!monitor.isOver(),
			}),
		}),
		[]
	)

	return (
		<div ref={drop} className={classNames('layer', { isOver })}>
			<div className="layer__name">{layerName}</div>
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
