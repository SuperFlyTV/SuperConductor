import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { useMovable } from '../../../../lib/useMovable'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { GUIContext } from '../../../contexts/GUI'
import { HotkeyContext } from '../../../contexts/Hotkey'
import classNames from 'classnames'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { TimelineObjectMove, TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'

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
	const ref = useRef<HTMLDivElement>(null)
	const [isMoved, deltaX, _deltaY, pointerX, pointerY, originX, originY] = useMovable(ref.current, {
		dragging: move.leaderTimelineObjId === timelineObj.obj.id && Boolean(move.moveType),
		pointerX: move.pointerX ?? 0,
		pointerY: move.pointerY ?? 0,
		originX: move.originX ?? 0,
		originY: move.originY ?? 0,
	})
	const keyTracker = useContext(HotkeyContext)
	const [handledMoveStart, setHandledMoveStart] = useState(false)
	const updateMoveRef = useRef(updateMove)
	updateMoveRef.current = updateMove

	const obj: TSRTimelineObj = timelineObj.obj
	const instance = resolved.instances[0]
	const duration = instance.end ? instance.end - instance.start : null
	const widthPercentage = (duration ? duration / partDuration : 1) * 100 + '%'
	const startValue = Math.max(0, instance.start / partDuration)
	const startPercentage = startValue * 100 + '%'

	useEffect(() => {
		if (isMoved && !handledMoveStart) {
			// A move has begun.
			setHandledMoveStart(true)
		} else if (!isMoved && handledMoveStart) {
			// A move has completed.
			setHandledMoveStart(false)
			updateMove({
				moveType: null,
				wasMoved: move.moveType,
			})
		}
	}, [handledMoveStart, isMoved, move.moveType, partId, updateMove])

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
	}, [keyTracker])
	useEffect(() => {
		if (!isMoved) {
			return
		}

		const update: Partial<TimelineObjectMove> = {
			wasMoved: null,
			partId,
			leaderTimelineObjId: timelineObj.obj.id,
			moveType: 'whole',
			dragDelta: deltaX * msPerPixel,
			pointerX,
			pointerY,
			originX,
			originY,
		}

		const hoveredEl = document.elementFromPoint(pointerX, pointerY)
		const hoveredPartEl = hoveredEl?.closest('.part')
		if (hoveredPartEl) {
			const hoveredPartId = hoveredPartEl.getAttribute('data-part-id')
			if (hoveredPartId === partId) {
				const hoveredLayerEl = hoveredEl?.closest('.layer')
				if (hoveredLayerEl) {
					const hoveredLayerId = hoveredLayerEl.getAttribute('data-layer-id')
					update.hoveredLayerId = hoveredLayerId
				}
			}
		}

		updateMoveRef.current(update)
	}, [isMoved, deltaX, msPerPixel, timelineObj.obj.id, partId, pointerX, pointerY, originX, originY])

	return (
		<div
			ref={ref}
			className={classNames('object', description.contentTypeClassNames.join(' '), {
				selected: gui.selectedTimelineObjIds?.includes(obj.id),
			})}
			style={{ width: widthPercentage, left: startPercentage }}
			onPointerDown={() => {
				if (
					gui.selectedGroupId === groupId &&
					gui.selectedPartId === partId &&
					gui.selectedTimelineObjIds.includes(obj.id)
				) {
					if (allowMultiSelection) {
						// Deselect this timelineObj.
						updateGUI({
							selectedTimelineObjIds: [...gui.selectedTimelineObjIds.filter((id) => id !== obj.id)],
						})
					}

					return
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
