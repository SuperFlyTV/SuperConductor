import classNames from 'classnames'
import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { ResourceAny } from '../../../../models/resource/resource'
import { ItemTypes } from '../../../api/ItemTypes'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { TimelineObject } from './TimelineObject'

export const Layer: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	objectsOnLayer: TSRTimelineObj[]
	layerId: string
	partDuration: number
}> = ({ rundownId, layerId, groupId, partId, objectsOnLayer, partDuration }) => {
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
			<div className="layer__content">
				{objectsOnLayer.map((obj) => {
					return (
						<TimelineObject
							key={obj.id}
							groupId={groupId}
							partId={partId}
							obj={obj}
							partDuration={partDuration}
						></TimelineObject>
					)
				})}
			</div>
		</div>
	)
}
