import { describeTimelineObject } from '@/lib/TimelineObj'
import { useMovable } from '@/lib/useMovable'
import { findGroup, findPart, findTimelineObj } from '@/lib/util'
import { TimelineObj } from '@/models/rundown/TimelineObj'
import { GUIContext } from '@/react/contexts/GUI'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { RundownContext } from '@/react/contexts/Rundown'
import { HotkeyContext } from '@/react/contexts/Hotkey'
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
	const moveRef = useRef(move)
	const [dragStartValue, setDragStartValue] = useState<number>()
	const dragDelta = useRef(0)
	const rundown = useContext(RundownContext)
	const ipcServer = useContext(IPCServerContext)
	const ref = useRef<HTMLDivElement>(null)
	const [trackWidth, setTrackWidth] = useState(0)
	const [isMoved, deltaX] = useMovable(ref.current)
	const [wasMoved, setWasMoved] = useState(false)
	const keyTracker = useContext(HotkeyContext)

	moveRef.current = move

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
			setWasMoved(true)
			setDragStartValue(startValue)

			return () => {
				// A move has completed.

				// Update this timeline object.
				if (!Array.isArray(obj.enable)) {
					obj.enable.start = Math.max(0, start + dragDelta.current * partDuration)
					ipcServer.updateTimelineObj({
						rundownId: rundown.id,
						partId: partId,
						groupId: groupId,
						timelineObjId: obj.id,
						timelineObj: timelineObj,
					})
				}

				// Update the other selected timeline objects which were also part of this move.
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
						if (
							otherTimelineObj &&
							!Array.isArray(otherTimelineObj.obj.enable) &&
							moveRef.current &&
							typeof moveRef.current.dragDelta === 'number'
						) {
							const newStart = (otherTimelineObj.obj.enable as any).start + moveRef.current.dragDelta * partDuration
							otherTimelineObj.obj.enable.start = Math.max(0, newStart)
							ipcServer.updateTimelineObj({
								rundownId: rundown.id,
								partId: partId,
								groupId: groupId,
								timelineObjId: id,
								timelineObj: otherTimelineObj,
							})
						}
					})

				// Clear relevant context state.
				updateMove({
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
			if (dragStartValue + dragDelta.current < 0) {
				newDragDelta = -dragStartValue
			}
			updateMove({
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
			onClick={() => {
				if (!wasMoved) {
					updateGUI({
						selectedGroupId: groupId,
						selectedPartId: partId,
						selectedTimelineObjIds:
							gui.selectedGroupId === groupId && gui.selectedPartId === partId && allowMultiSelection
								? [...gui.selectedTimelineObjIds, obj.id]
								: [obj.id],
					})
				}
				setWasMoved(false)
			}}
		>
			<div className="title">{description.label}</div>
		</div>
	)
}
