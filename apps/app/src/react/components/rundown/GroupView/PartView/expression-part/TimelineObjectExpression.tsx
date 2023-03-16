import sorensen from '@sofie-automation/sorensen'
import { describeTimelineObject } from '../../../../../../lib/TimelineObj'
import { TimelineObj } from '../../../../../../models/rundown/TimelineObj'
import classNames from 'classnames'
import React, { useCallback, useRef, useState } from 'react'
import { ResolvedTimelineObject, Resolver, TimelineObjectInstance } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { MdWarningAmber } from 'react-icons/md'
import { computed } from 'mobx'
import { sortLayers, timelineObjsOntoLayers } from '../../../../../../lib/partTimeline'
import { useFrame } from '../../../../../lib/useFrame'
import _ from 'lodash'
import { useMemoComputedObject } from '../../../../../mobx/lib'

export const TimelineObjectExpression: React.FC<{
	groupId: string
	partId: string
	/** Duration of the parent Part [ms] */
	partDuration: number
	timelineObj: TimelineObj
	locked?: boolean
	warnings?: string[]
}> = observer(function TimelineObjectExpression({ groupId, partId, partDuration, timelineObj, locked, warnings }) {
	const ref = useRef<HTMLDivElement>(null)

	// const hotkeyContext = useContext(HotkeyContext)
	// const [allowDuplicate, setAllowDuplicate] = useState(false)

	// const [moveType, setMoveType] = useState<TimelineObjectMove['moveType']>('whole')
	// const wasMoving = useRef(false)

	const obj: TSRTimelineObj = timelineObj.obj

	const selectable = !locked
	// const movable = !locked

	const resolvedObj = useMemoComputedObject(
		() => {
			const resolved = store.timelineStore.getResolvedTimeline()

			return resolved?.objects[obj.id]
		},
		[obj.id],
		true
	)

	// const dragData = useRef({
	// 	msPerPixel,
	// 	groupId,
	// 	partId,
	// 	moveType,
	// 	timelineObjId: obj.id,
	// 	allowDuplicate,
	// 	movable,
	// })
	// useEffect(() => {
	// 	dragData.current = {
	// 		msPerPixel,
	// 		groupId,
	// 		partId,
	// 		moveType,
	// 		timelineObjId: obj.id,
	// 		allowDuplicate,
	// 		movable,
	// 	}
	// }, [msPerPixel, partId, moveType, obj.id, allowDuplicate, selectable, movable, groupId])
	// const onDragStart = useCallback((startPosition: { clientX: number; clientY: number }) => {
	// 	// A move has begun.
	// 	const dd = dragData.current

	// 	if (!dd.movable) return

	// 	wasMoving.current = true

	// 	if (
	// 		!store.guiStore.isSelected({
	// 			type: 'timelineObj',
	// 			groupId: dd.groupId,
	// 			partId: dd.partId,
	// 			timelineObjId: dd.timelineObjId,
	// 		})
	// 	) {
	// 		store.guiStore.setSelected({
	// 			type: 'timelineObj',
	// 			groupId: dd.groupId,
	// 			partId: dd.partId,
	// 			timelineObjId: dd.timelineObjId,
	// 		})
	// 	}

	// 	store.guiStore.updateTimelineObjMove({
	// 		wasMoved: null,
	// 		moveId: shortID(),
	// 		partId: dd.partId,
	// 		moveType: dd.moveType,
	// 		leaderTimelineObjId: dd.timelineObjId,
	// 		originX: startPosition.clientX,
	// 		originY: startPosition.clientY,
	// 		saving: false,
	// 	})
	// }, [])
	// const onDragMove = useCallback((delta: DeltaPosition, position: Position) => {
	// 	const dd = dragData.current

	// 	const update: Partial<TimelineObjectMove> = {
	// 		dragDelta: delta.x * dd.msPerPixel,
	// 		duplicate: dd.allowDuplicate,
	// 	}
	// 	const hoveredEl = document.elementFromPoint(position.clientX, position.clientY)
	// 	const hoveredPartEl = hoveredEl?.closest('.part')
	// 	if (hoveredPartEl) {
	// 		const hoveredPartId = hoveredPartEl.getAttribute('data-part-id')
	// 		if (hoveredPartId === dd.partId) {
	// 			const hoveredLayerEl = hoveredEl?.closest('.layer')
	// 			if (hoveredLayerEl) {
	// 				const hoveredLayerId = hoveredLayerEl.getAttribute('data-layer-id')
	// 				update.hoveredLayerId = hoveredLayerId
	// 			}
	// 		}
	// 	}
	// 	store.guiStore.updateTimelineObjMove(update)
	// }, [])
	// const onDragEnd = useCallback((_delta: DeltaPosition, _position: Position) => {
	// 	// A move has completed.

	// 	const dd = dragData.current

	// 	store.guiStore.updateTimelineObjMove({
	// 		moveType: null,
	// 		wasMoved: dd.moveType,
	// 	})
	// 	setMoveType(null)
	// }, [])

	// useEffect(() => {
	// 	// on startup

	// 	if (
	// 		store.guiStore.timelineObjMove.originX !== undefined &&
	// 		store.guiStore.timelineObjMove.originY !== undefined &&
	// 		!store.guiStore.timelineObjMove.saving &&
	// 		store.guiStore.timelineObjMove.leaderTimelineObjId === obj.id
	// 	) {
	// 		// This happens when the user moves the timeline-object to a new layer.
	// 		// So the move in the previous instance of this object has aborted,
	// 		// so we should take it over

	// 		move.onStartMoving({
	// 			clientX: store.guiStore.timelineObjMove.originX,
	// 			clientY: store.guiStore.timelineObjMove.originY,
	// 		})
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [])

	// const move = useMovable(ref, {
	// 	onDragStart,
	// 	onDragMove,
	// 	onDragEnd,
	// })

	// const instance: TimelineObjectInstance =  ?? {
	// 	id: 'N/A',
	// 	start: 0,
	// 	end: 0,
	// 	references: [],
	// }

	const [displayInstances, setDisplayInstances] = useState<
		{
			left: string | undefined
			width: string | undefined
			right: string | undefined
			zIndex: number
		}[]
	>([])

	useFrame(
		(_nowTime) => {
			if (!resolvedObj) return false

			const newDisplayInstances: {
				left: string | undefined
				width: string | undefined
				right: string | undefined
				zIndex: number
			}[] = []

			for (const instance of resolvedObj.resolved.instances) {
				const startValue = Math.max(0, instance.start / partDuration)
				const startPercentage = Math.min(
					// Cap to 98, because if 100, the object is not visible
					98,
					startValue * 100
				)
				const duration = instance.end !== null ? instance.end - instance.start : null
				let widthPercentage: number | null = Math.min((duration ? duration / partDuration : 1) * 100)
				if (widthPercentage > 100 - startPercentage) {
					// Limit the width, so that the rightmost part is always visible
					widthPercentage = null
				}

				newDisplayInstances.push({
					left: `${startValue}%`,
					width: widthPercentage !== null ? `${widthPercentage}%` : undefined,
					right: widthPercentage === null ? '-4px' : undefined,
					zIndex: Math.round(startPercentage),
				})
			}

			if (!_.isEqual(newDisplayInstances, displayInstances)) {
				setDisplayInstances(displayInstances)
			}
			return true
		},
		[resolvedObj]
	)

	const description = describeTimelineObject(obj)

	// useEffect(() => {
	// 	const onKey = () => {
	// 		const pressed = sorensen.getPressedKeys()
	// 		setAllowDuplicate(pressed.includes('AltLeft') || pressed.includes('AltRight'))

	// 		// Debounce to let setAllowDuplicate update:
	// 		setTimeout(
	// 			CB(() => move.updateMove()),
	// 			1
	// 		)
	// 	}
	// 	onKey()

	// 	sorensen.bind('Shift', onKey, {
	// 		up: false,
	// 		global: true,
	// 	})
	// 	sorensen.bind('Shift', onKey, {
	// 		up: true,
	// 		global: true,
	// 	})

	// 	sorensen.bind('Alt', onKey, {
	// 		up: false,
	// 		global: true,
	// 	})
	// 	sorensen.bind('Alt', onKey, {
	// 		up: true,
	// 		global: true,
	// 	})

	// 	sorensen.addEventListener('keycancel', onKey)

	// 	return () => {
	// 		sorensen.unbind('Shift', onKey)
	// 		sorensen.unbind('Alt', onKey)
	// 		sorensen.removeEventListener('keycancel', onKey)
	// 	}
	// }, [hotkeyContext, move])

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

	// const durationTitle = timelineObjectDurationString(duration)

	// const [isAtMinWidth, setIsAtMinWidth] = useState(false)
	// useEffect(() => {
	// 	if (!ref.current) {
	// 		return
	// 	}

	// 	const elemToObserve = ref.current
	// 	const resizeObserver = new ResizeObserver((entries) => {
	// 		for (const entry of entries) {
	// 			setIsAtMinWidth(entry.contentRect.width <= HANDLE_WIDTH * 2)
	// 		}
	// 	})

	// 	resizeObserver.observe(elemToObserve)

	// 	return () => {
	// 		resizeObserver.unobserve(elemToObserve)
	// 	}
	// }, [])

	const isSelected = computed(() =>
		store.guiStore.isSelected({
			type: 'timelineObj',
			groupId: groupId,
			partId: partId,
			timelineObjId: obj.id,
		})
	)

	return (
		<>
			{displayInstances.map((instance) => (
				<div
					ref={ref}
					className={classNames('timeline-object', description.contentTypeClassNames.join(' '), {
						selectable,
						selected: isSelected.get(),
						// isAtMinWidth,
						locked,
						warning: warnings && warnings.length > 0,
					})}
					style={{
						left: instance.left,
						width: instance.width,
						right: instance.right,
						zIndex: instance.zIndex,
					}}
					onClick={updateSelection}
					title={warnings && warnings.length > 0 ? warnings.join(', ') : description.label}
				>
					<div className="body">
						{warnings && warnings.length > 0 && (
							<div className="warning-icon">
								<MdWarningAmber size={18} />
							</div>
						)}
						<div className="title">{description.label}</div>
						{/* <TimelineObjectDuration duration={duration} /> */}
					</div>
				</div>
			))}
		</>
	)
})
