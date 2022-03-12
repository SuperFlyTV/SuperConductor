import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { useMovable } from '../../../../lib/useMovable'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
// import { GUIContext } from '../../../contexts/GUI'
import { HotkeyContext } from '../../../contexts/Hotkey'
import classNames from 'classnames'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { TimelineObjectMove, TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'
import short from 'short-uuid'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'

const HANDLE_WIDTH = 8

export const TimelineObject: React.FC<{
	groupId: string
	partId: string
	/** Duration of the parent Part [ms] */
	partDuration: number
	/** "zoom" [ms/pixel] */
	msPerPixel: number
	timelineObj: TimelineObj
	resolved: ResolvedTimelineObject['resolved']
}> = observer(({ groupId, partId, timelineObj, partDuration, resolved, msPerPixel }) => {
	// const { gui, updateGUI } = useContext(GUIContext)

	const gui = store.guiStore

	const { timelineObjMove, updateTimelineObjMove } = useContext(TimelineObjectMoveContext)
	const ref = useRef<HTMLDivElement>(null)
	const [isMoved, deltaX, _deltaY, pointerX, pointerY, originX, originY] = useMovable(ref.current, {
		dragging: timelineObjMove.leaderTimelineObjId === timelineObj.obj.id && Boolean(timelineObjMove.moveType),
		pointerX: timelineObjMove.pointerX ?? 0,
		pointerY: timelineObjMove.pointerY ?? 0,
		originX: timelineObjMove.originX ?? 0,
		originY: timelineObjMove.originY ?? 0,
	})
	const hotkeyContext = useContext(HotkeyContext)
	const [handledMoveStart, setHandledMoveStart] = useState(false)
	const [allowMultiSelection, setAllowMultiSelection] = useState(false)
	const [allowDuplicate, setAllowDuplicate] = useState(false)
	const [moveType, setMoveType] = useState<TimelineObjectMove['moveType']>('whole')
	const updateMoveRef = useRef(updateTimelineObjMove)
	updateMoveRef.current = updateTimelineObjMove

	const obj: TSRTimelineObj = timelineObj.obj
	const instance = resolved.instances[0]
	const duration = instance.end ? instance.end - instance.start : null
	const widthPercentage = (duration ? duration / partDuration : 1) * 100 + '%'
	const startValue = Math.max(0, instance.start / partDuration)
	const startPercentage = startValue * 100 + '%'

	const description = describeTimelineObject(obj, typeof duration === 'number' ? duration : undefined)

	useEffect(() => {
		const keyTracker = hotkeyContext.sorensen
		const onKey = () => {
			const pressed = keyTracker.getPressedKeys()
			setAllowMultiSelection(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
			setAllowDuplicate(pressed.includes('AltLeft') || pressed.includes('AltRight'))
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

		keyTracker.bind('Alt', onKey, {
			up: false,
			global: true,
		})
		keyTracker.bind('Alt', onKey, {
			up: true,
			global: true,
		})

		keyTracker.addEventListener('keycancel', onKey)

		return () => {
			keyTracker.unbind('Shift', onKey)
			keyTracker.unbind('Alt', onKey)
		}
	}, [hotkeyContext])

	// This useEffect hook and the one immediately following it are order-sensitive.
	useEffect(() => {
		if (!isMoved) {
			return
		}

		const update: Partial<TimelineObjectMove> = {
			wasMoved: null,
			partId,
			leaderTimelineObjId: timelineObj.obj.id,
			moveType,
			dragDelta: deltaX * msPerPixel,
			pointerX,
			pointerY,
			originX,
			originY,
			duplicate: allowDuplicate,
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
	}, [
		isMoved,
		deltaX,
		msPerPixel,
		timelineObj.obj.id,
		partId,
		pointerX,
		pointerY,
		originX,
		originY,
		allowDuplicate,
		moveType,
	])
	useEffect(() => {
		if (isMoved && !handledMoveStart) {
			// A move has begun.

			setHandledMoveStart(true)
			updateTimelineObjMove({
				moveId: short.generate(),
			})
		} else if (!isMoved && handledMoveStart) {
			// A move has completed.

			setHandledMoveStart(false)
			updateTimelineObjMove({
				moveType: null,
				wasMoved: timelineObjMove.moveType,
			})
		}
	}, [handledMoveStart, isMoved, timelineObjMove.moveType, updateTimelineObjMove])

	const updateSelection = () => {
		if (
			gui.selectedGroupId === groupId &&
			gui.selectedPartId === partId &&
			gui.selectedTimelineObjIds.includes(obj.id)
		) {
			if (allowMultiSelection) {
				// Deselect this timelineObj.
				store.guiStore.selectedTimelineObjIds = gui.selectedTimelineObjIds.filter((id) => id !== obj.id)
				// updateGUI({
				// 	selectedTimelineObjIds: [...gui.selectedTimelineObjIds.filter((id) => id !== obj.id)],
				// })
			}

			return
		}

		if (allowMultiSelection) {
			if (gui.selectedGroupId === groupId && gui.selectedPartId === partId) {
				if (!gui.selectedTimelineObjIds.includes(obj.id)) {
					store.guiStore.selectedTimelineObjIds = [...gui.selectedTimelineObjIds, obj.id]
					// updateGUI({
					// 	selectedTimelineObjIds: [...gui.selectedTimelineObjIds, obj.id],
					// })
				}
			} else {
				store.guiStore.selectedGroupId = groupId
				store.guiStore.selectedPartId = partId
				store.guiStore.selectedTimelineObjIds = [obj.id]
				// updateGUI({
				// 	selectedGroupId: groupId,
				// 	selectedPartId: partId,
				// 	selectedTimelineObjIds: [obj.id],
				// })
			}
		} else {
			store.guiStore.selectedGroupId = groupId
			store.guiStore.selectedPartId = partId
			store.guiStore.selectedTimelineObjIds = [obj.id]
			// updateGUI({
			// 	selectedGroupId: groupId,
			// 	selectedPartId: partId,
			// 	selectedTimelineObjIds: [obj.id],
			// })
		}
	}

	const { minutes, seconds, secondTenths } = description.parsedDuration || {}
	let durationTitle = ''
	if (minutes) {
		durationTitle += minutes + 'm'
	}
	if (seconds) {
		durationTitle += seconds + '.' + secondTenths + 's'
	}

	const [isAtMinWidth, setIsAtMinWidth] = useState(false)
	useEffect(() => {
		if (!ref.current) {
			return
		}

		const elemToObserve = ref.current
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setIsAtMinWidth(entry.contentRect.width <= HANDLE_WIDTH * 2)
			}
		})

		resizeObserver.observe(elemToObserve)

		return () => {
			resizeObserver.unobserve(elemToObserve)
		}
	}, [])

	return (
		<div
			ref={ref}
			className={classNames('object', description.contentTypeClassNames.join(' '), {
				selected: gui.selectedTimelineObjIds?.includes(obj.id),
				isAtMinWidth,
			})}
			style={{ width: widthPercentage, left: startPercentage }}
			onPointerDown={updateSelection}
			title={description.label + ' ' + durationTitle}
		>
			<div
				className="handle handle--left"
				onPointerDown={() => {
					if (ref.current) {
						const box = ref.current.getBoundingClientRect()
						if (box.width <= HANDLE_WIDTH * 2) {
							return setMoveType('whole')
						}
					}

					setMoveType('start')
				}}
			/>
			<div
				className="body"
				onPointerDown={() => {
					setMoveType('whole')
				}}
			>
				<div className="title">{description.label}</div>
				<div className="duration">
					{minutes ? (
						<>
							<span>{minutes}</span>
							<span style={{ fontWeight: 300 }}>m</span>
						</>
					) : null}
					{seconds ? (
						<>
							<span>{seconds}</span>
							<span style={{ fontWeight: 300 }}>.</span>
							<span>{secondTenths}</span>
							<span style={{ fontWeight: 300 }}>s</span>
						</>
					) : null}
				</div>
			</div>
			<div
				className="handle handle--right"
				onPointerDown={() => {
					if (ref.current) {
						const box = ref.current.getBoundingClientRect()
						if (box.width <= HANDLE_WIDTH * 2) {
							return setMoveType('whole')
						}
					}

					setMoveType('duration')
				}}
			/>
		</div>
	)
})
