import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { useMovable } from '../../../../lib/useMovable'
import { findGroup, findPart, findTimelineObj } from '../../../../lib/util'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { GUIContext } from '../../../contexts/GUI'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { RundownContext } from '../../../contexts/Rundown'
import { HotkeyContext } from '../../../contexts/Hotkey'
import classNames from 'classnames'
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'
import { SnapPoint } from './PartView'

type SnapPointType = 'start' | 'end'

/**
 * How close an edge of a timeline object needs to be to another edge before it will snap to that edge (in pixels).
 */
const SNAP_DISTANCE_IN_PIXELS = 10

export const TimelineObject: React.FC<{
	groupId: string
	partId: string
	partDuration: number
	timelineObj: TimelineObj
	resolved: ResolvedTimelineObject['resolved']
	snapPoints: SnapPoint[]
}> = ({ groupId, partId, timelineObj, partDuration, snapPoints }) => {
	const { gui, updateGUI } = useContext(GUIContext)
	const { move, updateMove } = useContext(TimelineObjectMoveContext)
	const [dragStartValue, setDragStartValue] = useState<number>()
	const dragDelta = useRef(0)
	const rundown = useContext(RundownContext)
	const ipcServer = useContext(IPCServerContext)
	const ref = useRef<HTMLDivElement>(null)
	const [trackWidth, setTrackWidth] = useState(0)
	const [isMoved, deltaX] = useMovable(ref.current)
	const keyTracker = useContext(HotkeyContext)
	const updateMoveRef = useRef(updateMove)
	const [snapPoint, setSnapPoint] = useState<SnapPoint & { type: SnapPointType }>()
	const snapPointRef = useRef<SnapPoint & { type: SnapPointType }>()
	const [bypassSnapping, setBypassSnapping] = useState(false)

	snapPointRef.current = snapPoint
	updateMoveRef.current = updateMove

	// Initialize trackWidth.
	useLayoutEffect(() => {
		if (ref.current && ref.current.parentElement) {
			const size = ref.current.parentElement.getBoundingClientRect()
			setTrackWidth(size.width)
		}
	}, [])

	// Update trackWidth during a move.
	useLayoutEffect(() => {
		if (isMoved && ref.current && ref.current.parentElement) {
			const size = ref.current.parentElement.getBoundingClientRect()
			setTrackWidth(size.width)
		}
	}, [isMoved])

	const obj: TSRTimelineObj = timelineObj.obj

	const start: number = (obj.enable as any).start
	const duration: number = (obj.enable as any).duration

	if (isMoved) {
		dragDelta.current = deltaX / trackWidth
	}

	const widthPercentage = (duration / partDuration) * 100 + '%'
	let startValue = Math.max(0, start / partDuration + (isMoved ? dragDelta.current : 0))
	const isPartOfGroupMove = typeof move.dragDelta === 'number' && gui.selectedTimelineObjIds.includes(obj.id)
	if (!isMoved && isPartOfGroupMove) {
		// This timeline object is part of a selection that is currently being moved,
		// but it is not the timeline object actually being dragged.
		// Therefore, it needs to follow the timeline object actually being dragged
		// such that it moves in unison with it.
		startValue = Math.max(0, start / partDuration + (move as any).dragDelta)
	} else if (snapPoint) {
		if (snapPoint.type === 'start') {
			startValue = Math.max(0, snapPoint.time / partDuration)
		} else {
			startValue = Math.max(0, (snapPoint.time - (timelineObj.obj.enable as any).duration) / partDuration)
		}
	}
	const startPercentage = startValue * 100 + '%'

	useEffect(() => {
		if (!isMoved) {
			setSnapPoint(undefined)
			return
		}

		/**
		 * How many milliseconds are represented by each column of pixels on the track.
		 */
		const msPerPixel = partDuration / trackWidth

		/**
		 * How close an edge of a timeline object needs to be to another edge before it will snap to that edge (in milliseconds).
		 */
		const snapDistanceInMilliseconds = msPerPixel * SNAP_DISTANCE_IN_PIXELS

		const startValueInMilliseconds = Math.max(0, start + dragDelta.current * partDuration)
		const endValueInMilliseconds = startValueInMilliseconds + duration

		let snapPointType: SnapPointType | undefined
		const closestSnapPoint = snapPoints.find((sp) => {
			// Ignore own snap points.
			if (sp.timelineObjId === timelineObj.obj.id) {
				return
			}

			// Ignore snap points belonging to other selected timeline objects.
			if (gui.selectedTimelineObjIds.includes(sp.timelineObjId)) {
				return
			}

			if (Math.abs(sp.time - startValueInMilliseconds) <= snapDistanceInMilliseconds) {
				snapPointType = 'start'
				return sp
			}

			if (Math.abs(sp.time - endValueInMilliseconds) <= snapDistanceInMilliseconds) {
				snapPointType = 'end'
				return sp
			}
		})

		if (!bypassSnapping && closestSnapPoint && snapPointType) {
			setSnapPoint({
				...closestSnapPoint,
				type: snapPointType,
			})
		} else {
			setSnapPoint(undefined)
		}
	}, [
		duration,
		isMoved,
		partDuration,
		snapPoints,
		start,
		timelineObj.obj.id,
		trackWidth,
		deltaX,
		bypassSnapping,
		gui.selectedTimelineObjIds,
	])

	useEffect(() => {
		if (isMoved) {
			// A move has begun.
			updateMoveRef.current({ wasMoved: true })
			setDragStartValue(startValue)

			return () => {
				// A move has completed.

				// Update this timeline object.
				let startDiff: number | undefined
				if (!Array.isArray(obj.enable)) {
					const oldStart = obj.enable.start as any
					let newStart: number
					if (snapPointRef.current) {
						if (snapPointRef.current.type === 'start') {
							newStart = snapPointRef.current.time
						} else {
							newStart = snapPointRef.current.time - (timelineObj.obj.enable as any).duration
						}
					} else {
						newStart = Math.max(0, start + dragDelta.current * partDuration)
					}
					startDiff = newStart - oldStart
					obj.enable.start = newStart
					ipcServer
						.updateTimelineObj({
							rundownId: rundown.id,
							partId: partId,
							groupId: groupId,
							timelineObjId: obj.id,
							timelineObj: timelineObj,
						})
						.catch(console.error)
				}

				// Update the other selected timeline objects which were also part of this move.
				if (startDiff) {
					gui.selectedTimelineObjIds
						.filter((id) => id !== obj.id)
						.forEach((id) => {
							const group = findGroup(rundown, groupId)
							if (!group) {
								return
							}

							const part = findPart(group, partId)
							if (!part) {
								return
							}

							const otherTimelineObj = findTimelineObj(part, id)
							if (otherTimelineObj && !Array.isArray(otherTimelineObj.obj.enable)) {
								const oldStart = (otherTimelineObj.obj.enable as any).start
								const newStart = oldStart + startDiff
								otherTimelineObj.obj.enable.start = Math.max(0, newStart)
								ipcServer
									.updateTimelineObj({
										rundownId: rundown.id,
										partId: partId,
										groupId: groupId,
										timelineObjId: id,
										timelineObj: otherTimelineObj,
									})
									.catch(console.error)
							}
						})
				}

				// Clear relevant context state.
				updateMoveRef.current({
					isMoving: false,
					dragDelta: undefined,
				})
			}
		}
	}, [isMoved, partDuration, obj.id, rundown.id, partId, groupId, obj.layer, start, duration])

	const description = describeTimelineObject(obj)

	const [allowMultiSelection, setAllowMultiSelection] = useState(false)
	useEffect(() => {
		const onKey = () => {
			const pressed = keyTracker.getPressedKeys()
			setAllowMultiSelection(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
			setBypassSnapping(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
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
	}, [])
	useEffect(() => {
		if (isMoved && typeof dragStartValue === 'number') {
			let newDragDelta = dragDelta.current

			if (snapPoint) {
				// @TODO: this math is wrong
				// @TODO: account for heads/tails
				const snapPointPercentage = snapPoint.time / partDuration
				const snapPointDelta = dragStartValue - snapPointPercentage
				console.log({ dragStartValue, snapPointPercentage })
				newDragDelta = dragStartValue - snapPointDelta
			} else if (dragStartValue + dragDelta.current < 0) {
				// Clamp the drag delta such that the other TimelineObjects which are part of
				// this move won't continue moving left if this TimelineObject is already at timecode zero.
				// In other words: this helps ensure that all selected TimelineObjects always move as a group,
				// and don't slide around on top of each other.
				newDragDelta = -dragStartValue
			}

			// Store the modified drag delta so that the other TimelineObjects can use it.
			updateMoveRef.current({
				isMoving: true,
				dragDelta: newDragDelta,
			})
		}

		// This effect stops working as intended if dragDelta.current is removed as a dependency.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMoved, dragStartValue, snapPoint, partDuration, dragDelta.current])

	return (
		<div
			ref={ref}
			className={classNames('object', description.contentTypeClassNames.join(' '), {
				selected: gui.selectedTimelineObjIds?.includes(obj.id),
				moved: isMoved || isPartOfGroupMove,
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
