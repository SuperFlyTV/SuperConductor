import React, { useCallback, useContext, useMemo } from 'react'
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

	const [insertMarkerPercentage, setInsertMarkerPercentaeg] = React.useState<number | undefined>(undefined)

	const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const targetElement = e.target as HTMLDivElement
		if (targetElement.closest('.layer__content')) {
			const rect = targetElement.getBoundingClientRect()

			const percentage = (e.clientX - rect.x) / rect.width

			setInsertMarkerPercentaeg(percentage)
		}
	}, [])
	const onMouseClick = useCallback(() => {
		if (insertMarkerPercentage !== undefined && insertMarkerPercentage > 0) {
			const part = store.rundownsStore.getPart(partId)
			const markers = part.markers
			if (part.duration) {
				const insertTime = insertMarkerPercentage * part.duration

				markers.push({
					time: insertTime,
				})

				ipcServer
					.updatePart({
						rundownId,
						groupId,
						partId,
						part: {
							markers,
						},
					})
					.catch(handleError)
			}
		}
	}, [handleError, ipcServer, rundownId, groupId, partId, insertMarkerPercentage])

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
			<div className="layer__content" onMouseMove={onMouseMove} onClick={onMouseClick}>
				{insertMarkerPercentage && (
					<div className="insert-marker" style={{ left: `${insertMarkerPercentage * 100}%` }}></div>
				)}
			</div>
		</DropZone>
	)
})
