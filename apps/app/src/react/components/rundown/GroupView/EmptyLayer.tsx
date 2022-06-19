import React, { useContext, useMemo } from 'react'
import { useDrop } from 'react-dnd'
import { EMPTY_LAYER_ID_PREFIX } from '../../../../lib/util'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DropZone } from '../../util/DropZone'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { useMemoComputedValue } from '../../../mobx/lib'

let EMPTY_LAYER_ID_COUNTER = 0

export const EmptyLayer: React.FC<{
	rundownId: string
	groupId: string
	partId: string
}> = observer(function EmptyLayer({ rundownId, groupId, partId }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: DragItemTypes.RESOURCE_ITEM,
			drop: (item: ResourceDragItem) => {
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

	const layerId = useMemo(() => {
		return `${EMPTY_LAYER_ID_PREFIX}-${EMPTY_LAYER_ID_COUNTER++}`
	}, [])

	const canMoveTimelineObjToThisEmptyLayer = useMemoComputedValue(() => {
		return (
			store.guiStore.timelineObjMove.moveType === 'whole' &&
			store.guiStore.timelineObjMove.hoveredLayerId === layerId &&
			store.guiStore.selected.timelineObjIds.length === 1
		)
	}, [layerId])

	return (
		<DropZone
			ref={drop}
			className="layer"
			isOver={isOver || canMoveTimelineObjToThisEmptyLayer}
			data-layer-id={layerId}
		>
			<div className="layer__content">{/* empty */}</div>
		</DropZone>
	)
})
