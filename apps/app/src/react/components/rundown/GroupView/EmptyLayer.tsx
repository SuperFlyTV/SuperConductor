import classNames from 'classnames'
import React, { useContext, useMemo, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { EMPTY_LAYER_ID_PREFIX } from '../../../../lib/util'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { GUIContext } from '../../../contexts/GUI'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'

let EMPTY_LAYER_ID_COUNTER = 0

export const EmptyLayer: React.FC<{
	rundownId: string
	groupId: string
	partId: string
}> = ({ rundownId, groupId, partId }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const { timelineObjMove } = useContext(TimelineObjectMoveContext)
	const { gui } = useContext(GUIContext)
	const ref = useRef<HTMLDivElement>(null)
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
	drop(ref)

	const layerId = useMemo(() => {
		return `${EMPTY_LAYER_ID_PREFIX}-${EMPTY_LAYER_ID_COUNTER++}`
	}, [])

	const canMoveTimelineObjToThisEmptyLayer =
		timelineObjMove.moveType === 'whole' &&
		timelineObjMove.hoveredLayerId === layerId &&
		gui.selectedTimelineObjIds.length === 1

	return (
		<div
			ref={ref}
			className={classNames('layer', {
				isOver: isOver || canMoveTimelineObjToThisEmptyLayer,
			})}
			data-layer-id={layerId}
		>
			<div className="layer__content">{/* empty */}</div>
			<div className="layer__outline">{/* empty */}</div>
		</div>
	)
}
