import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { useMovable } from '../../../../lib/useMovable'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { GUIContext } from '../../../contexts/GUI'
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
	const ref = useRef<HTMLDivElement>(null)
	const [isMoved, deltaX] = useMovable(ref.current)
	const keyTracker = useContext(HotkeyContext)
	const updateMoveRef = useRef(updateMove)
	updateMoveRef.current = updateMove

	const obj: TSRTimelineObj = timelineObj.obj
	const instance = resolved.instances[0]
	const duration = instance.end ? instance.end - instance.start : null
	const widthPercentage = (duration ? duration / partDuration : 1) * 100 + '%'
	const startValue = Math.max(0, instance.start / partDuration)
	const isPartOfMultiMove = typeof move.dragDelta === 'number' && gui.selectedTimelineObjIds.includes(obj.id)
	const startPercentage = startValue * 100 + '%'

	useEffect(() => {
		if (isMoved) {
			// A move has begun.
			updateMoveRef.current({ wasMoved: null, partId })

			return () => {
				// A move has completed.
				updateMoveRef.current({
					moveType: null,
					wasMoved: move.moveType,
				})
			}
		}
	}, [isMoved, move.moveType, partId])

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
		if (isMoved) {
			updateMoveRef.current({
				leaderTimelineObjId: timelineObj.obj.id,
				moveType: 'whole',
				dragDelta: deltaX * msPerPixel,
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
