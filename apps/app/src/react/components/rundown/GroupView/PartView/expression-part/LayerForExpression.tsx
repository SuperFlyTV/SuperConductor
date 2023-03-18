import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext } from 'react'
import { useDrop } from 'react-dnd'
import { useMemoComputedObject } from '../../../../../mobx/lib'
import { store } from '../../../../../../react/mobx/store'
import { ResolvedTimelineObject, Resolver } from 'superfly-timeline'
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
import classNames from 'classnames'
import { computed } from 'mobx'
import sorensen from '@sofie-automation/sorensen'
import { sortLayers, timelineObjsOntoLayers } from '../../../../../../lib/partTimeline'

export const LayerForExpression: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	timelineObjId: string
	layerId: string
	partDuration: number
	locked?: boolean
	mapping: Mapping | undefined
}> = observer(({ rundownId, layerId, groupId, partId, timelineObjId, partDuration, locked, mapping }) => {
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

	const { warnings, timelineObj } = useMemoComputedObject(
		() => {
			const timelineObj = store.rundownsStore.getTimelineObj(timelineObjId)

			const warnings = []
			if (timelineObj) {
				if (typeof mapping !== 'undefined' && !filterMapping(mapping, timelineObj.obj)) {
					warnings.push('This object is not allowed on this layer type.')
				}
				if (typeof mapping === 'undefined') {
					warnings.push(`The layer "${layerId}" could not be found.`)
				}
			}
			return { warnings, timelineObj }
		},
		[timelineObjId],
		true
	)

	const obj = timelineObj.obj

	const selectable = !locked
	const isSelected = computed(() =>
		store.guiStore.isSelected({
			type: 'timelineObj',
			groupId: groupId,
			partId: partId,
			timelineObjId: obj.id,
		})
	)
	const updateSelection = useCallback(() => {
		if (!selectable) return
		// Prevent selection when dragging:
		// if (wasMoving.current) {
		// 	wasMoving.current = false
		// 	return
		// } else {
		// 	wasMoving.current = false
		// }

		const pressed = sorensen.getPressedKeys()
		if (pressed.includes('ControlLeft') || pressed.includes('ControlRight')) {
			// Add this timline-object to the selection:
			store.guiStore.toggleAddSelected({
				type: 'timelineObj',
				groupId: groupId,
				partId: partId,
				timelineObjId: obj.id,
			})
		} else if (pressed.includes('ShiftLeft') || pressed.includes('ShiftRight')) {
			// Add all timline-objects between the last selected and this one:
			const mainSelected = store.guiStore.mainSelected
			if (mainSelected && mainSelected.type === 'timelineObj' && mainSelected.partId === partId) {
				const project = store.projectStore.project
				const partTimeline = store.rundownsStore.getPartTimeline(partId)
				const resolvedTimeline = Resolver.resolveTimeline(
					partTimeline.map((o) => o.obj),
					{ time: 0 }
				)
				const sortedLayers = sortLayers(resolvedTimeline.layers, project.mappings)
				const timelineLayerObjects = timelineObjsOntoLayers(sortedLayers, resolvedTimeline, partTimeline)

				let mainLayerIndex = -1
				let thisLayerIndex = -1

				let mainObjStartTime: number | undefined = undefined
				let thisObjStartTime: number | undefined = undefined

				// Find start and end indexes:
				{
					let layerIndex = 0
					for (const { objectsOnLayer } of timelineLayerObjects) {
						for (const o of objectsOnLayer) {
							if (o.timelineObj.obj.id === mainSelected.timelineObjId) {
								mainLayerIndex = layerIndex
								mainObjStartTime = o.resolved.instances[0]?.start
							}
							if (o.timelineObj.obj.id === obj.id) {
								thisLayerIndex = layerIndex
								thisObjStartTime = o.resolved.instances[0]?.start
							}
						}
						layerIndex++
					}
				}
				if (
					mainLayerIndex !== -1 &&
					thisLayerIndex !== -1 &&
					mainObjStartTime !== undefined &&
					thisObjStartTime !== undefined
				) {
					const layerIndexes = [
						Math.min(mainLayerIndex, thisLayerIndex),
						Math.max(mainLayerIndex, thisLayerIndex),
					]
					const times = [
						Math.min(mainObjStartTime, thisObjStartTime),
						Math.max(mainObjStartTime, thisObjStartTime),
					]

					let layerIndex = 0
					for (const { objectsOnLayer } of timelineLayerObjects) {
						if (layerIndex >= layerIndexes[0] && layerIndex <= layerIndexes[1]) {
							for (const o of objectsOnLayer) {
								const startTime = o.resolved.instances[0]?.start
								if (startTime !== undefined && startTime >= times[0] && startTime <= times[1]) {
									store.guiStore.addSelected({
										type: 'timelineObj',
										groupId: groupId,
										partId: partId,
										timelineObjId: o.timelineObj.obj.id,
									})
								}
							}
						}
						layerIndex++
					}
				}
			}
		} else {
			store.guiStore.toggleSelected({
				type: 'timelineObj',
				groupId: groupId,
				partId: partId,
				timelineObjId: obj.id,
			})
		}
	}, [groupId, partId, obj.id])

	return (
		<DropZone ref={drop} className="layer" isOver={isOver} data-layer-id={layerId}>
			<div
				className={classNames('layer__content', {
					selectable,
					selected: isSelected.get(),
				})}
				onClick={updateSelection}
			>
				<TimelineObjectExpression
					groupId={groupId}
					partId={partId}
					partDuration={partDuration}
					timelineObj={timelineObj}
					locked={locked}
					warnings={warnings}
				/>
			</div>
		</DropZone>
	)
})
/** Analogue to LayerForExpression, used in initial-renders */
export function LayerEmptyForExpression(): JSX.Element {
	return (
		<div className="layer">
			<div className="layer__content" />
		</div>
	)
}
