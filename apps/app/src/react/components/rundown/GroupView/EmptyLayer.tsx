import React, { useContext, useMemo } from 'react'
import { useDrop } from 'react-dnd'
import { EMPTY_LAYER_ID_PREFIX } from '../../../../lib/util.js'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes.js'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler.js'
import { IPCServerContext } from '../../../contexts/IPCServer.js'
import { DropZone } from '../../util/DropZone.js'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store.js'
import { useMemoComputedValue } from '../../../mobx/lib.js'

let EMPTY_LAYER_ID_COUNTER = 0

export const EmptyLayer: React.FC<{
	rundownId: string
	groupId: string
	partId: string
}> = observer(function EmptyLayer({ rundownId, groupId, partId }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [{ isOver }, drop] = useDrop(
		// Use case: Drag Resources over this Empty Layer, to insert them as Timeline obejcts on a new Layer
		() => ({
			accept: DragItemTypes.RESOURCE_ITEM,
			drop: (item: ResourceDragItem) => {
				ipcServer
					.addResourcesToTimeline({
						rundownId,
						groupId,
						partId,
						layerId: null,
						resourceIds: item.resources.map((r) => r.id),
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
		return `${EMPTY_LAYER_ID_PREFIX}_${EMPTY_LAYER_ID_COUNTER++}`
	}, [])

	const canMoveTimelineObjToThisEmptyLayer = useMemoComputedValue(() => {
		return (
			store.guiStore.timelineObjMove.moveType === 'whole' &&
			store.guiStore.timelineObjMove.hoveredLayerId === layerId &&
			store.guiStore.selected.length === 1 &&
			store.guiStore.mainSelected?.type === 'timelineObj'
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
