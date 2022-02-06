import classNames from 'classnames'
import React, { useContext } from 'react'
import { useDrop } from 'react-dnd'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'

export const EmptyLayer: React.FC<{
	rundownId: string
	groupId: string
	partId: string
}> = ({ rundownId, groupId, partId }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: DragItemTypes.RESOURCE_ITEM,
			drop: (item: ResourceDragItem) => {
				console.log('drop', item)
				ipcServer
					.addResourceToTimeline({
						rundownId,
						groupId,
						partId,
						layerId: null,
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
		<div ref={drop} className={classNames('layer', { isOver })}>
			<div className="layer__content">{/* empty */}</div>
			<div className="layer__outline">{/* empty */}</div>
		</div>
	)
}
