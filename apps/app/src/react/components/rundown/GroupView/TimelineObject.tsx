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

export const TimelineObject: React.FC<{
	groupId: string
	partId: string
	partDuration: number
	timelineObj: TimelineObj
	resolved: ResolvedTimelineObject['resolved']
}> = ({ groupId, partId, timelineObj, partDuration }) => {
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
	}, [isMoved, ref.current])

	const obj: TSRTimelineObj = timelineObj.obj

	const start = (obj.enable as any).start
	const duration = (obj.enable as any).duration

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
	}
	const startPercentage = startValue * 100 + '%'

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
					const newStart = Math.max(0, start + dragDelta.current * partDuration)
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

			// Clamp the drag delta such that the other TimelineObjects which are part of
			// this move won't continue moving left if this TimelineObject is already at timecode zero.
			// In other words: this helps ensure that all selected TimelineObjects always move as a group,
			// and don't slide around on top of each other.
			if (dragStartValue + dragDelta.current < 0) {
				newDragDelta = -dragStartValue
			}

			// Store the modified drag delta so that the other TimelineObjects can use it.
			updateMoveRef.current({
				isMoving: true,
				dragDelta: newDragDelta,
			})
		}
	}, [isMoved, dragStartValue, dragDelta.current])

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
