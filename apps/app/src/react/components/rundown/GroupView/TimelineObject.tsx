import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { useMovable } from '../../../../lib/useMovable'
// import { findGroup, findPart, findTimelineObj } from '../../../../lib/util'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { GUIContext } from '../../../contexts/GUI'
// import { IPCServerContext } from '../../../contexts/IPCServer'
import { RundownContext } from '../../../contexts/Rundown'
import { HotkeyContext } from '../../../contexts/Hotkey'
import classNames from 'classnames'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'

export const TimelineObject: React.FC<{
	groupId: string
	partId: string
	/** Duration of the parent Part [ms] */
	partDuration: number
	/** "zoom" [ms/pixel] */
	msPerPixel: number
	timelineObj: TimelineObj
	resolved: ResolvedTimelineObject['resolved']
}> = ({ groupId, partId, timelineObj, partDuration, resolved, msPerPixel }) => {
	const { gui, updateGUI } = useContext(GUIContext)
	const { move, updateMove } = useContext(TimelineObjectMoveContext)
	// const dragDeltaPercentage = useRef(0)
	const rundown = useContext(RundownContext)
	// const ipcServer = useContext(IPCServerContext)
	const ref = useRef<HTMLDivElement>(null)
	const [isMoved, deltaX] = useMovable(ref.current)
	const keyTracker = useContext(HotkeyContext)
	const updateMoveRef = useRef(updateMove)
	// const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint & { type: SnapPointType }>()
	// const snapPointRef = useRef<SnapPoint & { type: SnapPointType }>()
	// const [bypassSnapping, setBypassSnapping] = useState(false)

	// snapPointRef.current = currentSnapPoint
	updateMoveRef.current = updateMove

	const obj: TSRTimelineObj = timelineObj.obj

	const instance = resolved.instances[0]

	// const start: Expression | undefined = enable.start
	// const duration: Expression | undefined = enable.duration
	// const end: Expression | undefined = enable.end

	// if (isMoved) {
	// 	dragDeltaPercentage.current = deltaX / trackWidth
	// }

	const duration = instance.end ? instance.end - instance.start : null

	const widthPercentage = (duration ? duration / partDuration : 1) * 100 + '%'

	const startValue = Math.max(0, instance.start / partDuration)
	// let startValue = Math.max(0, instance.start / partDuration + (isMoved ? dragDeltaPercentage.current : 0))

	const isPartOfMultiMove = typeof move.dragDelta === 'number' && gui.selectedTimelineObjIds.includes(obj.id)
	// if (!isMoved && isPartOfMultiMove && typeof move.dragDelta === 'number') {
	// 	// This timeline object is part of a selection that is currently being moved,
	// 	// but it is not the timeline object actually being dragged.
	// 	// Therefore, it needs to follow the timeline object actually being dragged
	// 	// such that it moves in unison with it.
	// 	// startValue = Math.max(0, instance.start / partDuration + move.dragDelta)
	// // } else if (currentSnapPoint) {
	// // 	if (currentSnapPoint.type === 'start') {
	// // 		startValue = Math.max(0, currentSnapPoint.time / partDuration)
	// // 		// startValue = snapPoint.expression
	// // 	} else {
	// // 		startValue = Math.max(0, (currentSnapPoint.time - (timelineObj.obj.enable as any).duration) / partDuration)
	// // 	}
	// }
	const startPercentage = startValue * 100 + '%'

	/**
	 * How many milliseconds are represented by each column of pixels on the track.
	 */
	// const msPerPixel = partDuration / trackWidth

	// useEffect(() => {
	// 	// if (!isMoved) {
	// 	// 	setCurrentSnapPoint(undefined)
	// 	// 	return
	// 	// }

	// 	// if (!bypassSnapping && closestSnapPoint && snapPointType) {
	// 	// 	setCurrentSnapPoint({
	// 	// 		...closestSnapPoint,
	// 	// 		type: snapPointType,
	// 	// 	})
	// 	// } else {
	// 	// 	setCurrentSnapPoint(undefined)
	// 	// }
	// }, [
	// 	duration,
	// 	isMoved,
	// 	partDuration,
	// 	snapPoints,
	// 	start,
	// 	timelineObj.obj.id,
	// 	trackWidth,
	// 	deltaX,
	// 	bypassSnapping,
	// 	gui.selectedTimelineObjIds,
	// ])

	useEffect(() => {
		if (isMoved) {
			// A move has begun.
			updateMoveRef.current({ wasMoved: null })

			return () => {
				// A move has completed.

				// Update this timeline object.
				// let startDiff: number | undefined
				// if (!Array.isArray(obj.enable)) {
				// 	const oldStart = obj.enable.start as any
				// 	let newStart: number
				// 	if (snapPointRef.current) {
				// 		// TODO: Use tha logic from PartView to set the right things
				// 		if (snapPointRef.current.type === 'start') {
				// 			newStart = snapPointRef.current.time
				// 		} else {
				// 			newStart = snapPointRef.current.time - (timelineObj.obj.enable as any).duration
				// 		}
				// 	} else {
				// 		newStart = Math.max(0, start + dragDeltaPercentage.current * partDuration)
				// 	}
				// 	startDiff = newStart - oldStart
				// 	obj.enable.start = newStart
				// 	ipcServer
				// 		.updateTimelineObj({
				// 			rundownId: rundown.id,
				// 			partId: partId,
				// 			groupId: groupId,
				// 			timelineObjId: obj.id,
				// 			timelineObj: timelineObj,
				// 		})
				// 		.catch(console.error)
				// }

				// Update the other selected timeline objects which were also part of this move.
				// if (startDiff) {
				// 	gui.selectedTimelineObjIds
				// 		.filter((id) => id !== obj.id)
				// 		.forEach((id) => {
				// 			const group = findGroup(rundown, groupId)
				// 			if (!group) {
				// 				return
				// 			}

				// 			const part = findPart(group, partId)
				// 			if (!part) {
				// 				return
				// 			}

				// 			const otherTimelineObj = findTimelineObj(part, id)
				// 			if (otherTimelineObj && !Array.isArray(otherTimelineObj.obj.enable)) {
				// 				const oldStart = (otherTimelineObj.obj.enable as any).start
				// 				const newStart = oldStart + startDiff
				// 				otherTimelineObj.obj.enable.start = Math.max(0, newStart)
				// 				ipcServer
				// 					.updateTimelineObj({
				// 						rundownId: rundown.id,
				// 						partId: partId,
				// 						groupId: groupId,
				// 						timelineObjId: id,
				// 						timelineObj: otherTimelineObj,
				// 					})
				// 					.catch(console.error)
				// 			}
				// 		})
				// }

				// Clear relevant context state.
				updateMoveRef.current({
					moveType: null,
					wasMoved: move.moveType,
				})
			}
		}
	}, [isMoved, partDuration, obj.id, rundown.id, partId, groupId, obj.layer, duration, startValue, move.moveType])

	const description = describeTimelineObject(obj)

	const [allowMultiSelection, setAllowMultiSelection] = useState(false)
	useEffect(() => {
		const onKey = () => {
			const pressed = keyTracker.getPressedKeys()
			setAllowMultiSelection(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
			// setBypassSnapping(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
		}
		onKey()

		keyTracker.bind('Shift', onKey, {
			up: false,
			global: true,
		})
		keyTracker.bind('Shift', onKey, {
			up: true,
			global: true,
		})

		return () => {
			keyTracker.unbind('Shift', onKey)
		}
	}, [keyTracker])
	useEffect(() => {
		if (isMoved) {
			/** [ms] */
			const newDragDelta = deltaX * msPerPixel

			// console.log('newDragDelta', newDragDelta)

			// if (currentSnapPoint) {
			// 	const snapPointPercentage = currentSnapPoint.time / partDuration
			// 	const snapPointDelta = dragStartValue - snapPointPercentage
			// 	// if (currentSnapPoint.type === 'start') {
			// 	// 	newDragDelta = dragStartValue - snapPointDelta
			// 	// } else if (typeof duration === 'number') {
			// 	// 	newDragDelta = dragStartValue - snapPointDelta - duration
			// 	// }
			// } else if (dragStartValue + dragDeltaPercentage.current < 0) {
			// 	// Clamp the drag delta such that the other TimelineObjects which are part of
			// 	// this move won't continue moving left if this TimelineObject is already at timecode zero.
			// 	// In other words: this helps ensure that all selected TimelineObjects always move as a group,
			// 	// and don't slide around on top of each other.
			// 	newDragDelta = -dragStartValue
			// }

			// Store the modified drag delta so that the other TimelineObjects can use it.
			updateMoveRef.current({
				leaderTimelineObjId: timelineObj.obj.id,
				moveType: 'whole',
				dragDelta: newDragDelta,
			})
		}
	}, [isMoved, deltaX, msPerPixel, timelineObj.obj.id])

	return (
		<div
			ref={ref}
			className={classNames('object', description.contentTypeClassNames.join(' '), {
				selected: gui.selectedTimelineObjIds?.includes(obj.id),
				moved: isMoved || isPartOfMultiMove,
			})}
			style={{ width: widthPercentage, left: startPercentage }}
			onPointerDown={() => {
				const isMultiSelected = gui.selectedTimelineObjIds.length > 1
				if (isMultiSelected) {
					if (
						gui.selectedGroupId === groupId &&
						gui.selectedPartId === partId &&
						gui.selectedTimelineObjIds.includes(obj.id)
					) {
						return
					}
				}

				if (allowMultiSelection) {
					if (gui.selectedGroupId === groupId && gui.selectedPartId === partId) {
						if (!gui.selectedTimelineObjIds.includes(obj.id)) {
							updateGUI({
								selectedTimelineObjIds: [...gui.selectedTimelineObjIds, obj.id],
							})
						}
					} else {
						updateGUI({
							selectedGroupId: groupId,
							selectedPartId: partId,
							selectedTimelineObjIds: [obj.id],
						})
					}
				} else {
					updateGUI({
						selectedGroupId: groupId,
						selectedPartId: partId,
						selectedTimelineObjIds: [obj.id],
					})
				}
			}}
		>
			<div className="title">{description.label}</div>
		</div>
	)
}
