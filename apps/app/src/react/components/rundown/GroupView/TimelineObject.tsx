import sorensen from '@sofie-automation/sorensen'
import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { useMovable } from '../../../../lib/useMovable'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { HotkeyContext } from '../../../contexts/Hotkey'
import classNames from 'classnames'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ResolvedTimelineObject, TimelineObjectInstance } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { MdWarningAmber } from 'react-icons/md'
import { TimelineObjectMove } from '../../../mobx/GuiStore'
import { shortID } from '../../../../lib/util'
import { computed } from 'mobx'
import { millisecondsToTime } from '../../../../lib/timeLib'

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
	locked?: boolean
	warnings?: string[]
}> = observer(function TimelineObject({
	groupId,
	partId,
	timelineObj,
	partDuration,
	resolved,
	msPerPixel,
	locked,
	warnings,
}) {
	const ref = useRef<HTMLDivElement>(null)

	const hotkeyContext = useContext(HotkeyContext)
	const [allowDuplicate, setAllowDuplicate] = useState(false)

	const [moveType, setMoveType] = useState<TimelineObjectMove['moveType']>('whole')
	const wasMoving = useRef(false)

	const obj: TSRTimelineObj = timelineObj.obj

	const selectable = !locked
	const movable = !locked

	const dragData = useRef({
		msPerPixel,
		groupId,
		partId,
		moveType,
		timelineObjId: obj.id,
		allowDuplicate,
		movable,
	})
	useEffect(() => {
		dragData.current = {
			msPerPixel,
			groupId,
			partId,
			moveType,
			timelineObjId: obj.id,
			allowDuplicate,
			movable,
		}
	}, [msPerPixel, partId, moveType, obj.id, allowDuplicate, selectable, movable, groupId])
	const onDragStart = useCallback((startPosition: { clientX: number; clientY: number }) => {
		// A move has begun.
		const dd = dragData.current

		if (!dd.movable) return

		wasMoving.current = true

		if (
			!store.guiStore.isSelected({
				type: 'timelineObj',
				groupId: dd.groupId,
				partId: dd.partId,
				timelineObjId: dd.timelineObjId,
			})
		) {
			store.guiStore.setSelected({
				type: 'timelineObj',
				groupId: dd.groupId,
				partId: dd.partId,
				timelineObjId: dd.timelineObjId,
			})
		}

		store.guiStore.updateTimelineObjMove({
			wasMoved: null,
			moveId: shortID(),
			partId: dd.partId,
			moveType: dd.moveType,
			leaderTimelineObjId: dd.timelineObjId,
			originX: startPosition.clientX,
			originY: startPosition.clientY,
			saving: false,
		})
	}, [])
	const onDragMove = useCallback((delta, position) => {
		const dd = dragData.current

		const update: Partial<TimelineObjectMove> = {
			dragDelta: delta.x * dd.msPerPixel,
			duplicate: dd.allowDuplicate,
		}
		const hoveredEl = document.elementFromPoint(position.clientX, position.clientY)
		const hoveredPartEl = hoveredEl?.closest('.part')
		if (hoveredPartEl) {
			const hoveredPartId = hoveredPartEl.getAttribute('data-part-id')
			if (hoveredPartId === dd.partId) {
				const hoveredLayerEl = hoveredEl?.closest('.layer')
				if (hoveredLayerEl) {
					const hoveredLayerId = hoveredLayerEl.getAttribute('data-layer-id')
					update.hoveredLayerId = hoveredLayerId
				}
			}
		}
		store.guiStore.updateTimelineObjMove(update)
	}, [])
	const onDragEnd = useCallback((_delta, _position) => {
		// A move has completed.

		const dd = dragData.current

		store.guiStore.updateTimelineObjMove({
			moveType: null,
			wasMoved: dd.moveType,
		})
		setMoveType(null)
	}, [])

	useEffect(() => {
		// on startup

		if (
			store.guiStore.timelineObjMove.originX !== undefined &&
			store.guiStore.timelineObjMove.originY !== undefined &&
			!store.guiStore.timelineObjMove.saving &&
			store.guiStore.timelineObjMove.leaderTimelineObjId === timelineObj.obj.id
		) {
			// This happens when the user moves the timeline-object to a new layer.
			// So the move in the previous instance of this object has aborted,
			// so we should take it over

			move.onStartMoving({
				clientX: store.guiStore.timelineObjMove.originX,
				clientY: store.guiStore.timelineObjMove.originY,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const move = useMovable(ref, {
		onDragStart,
		onDragMove,
		onDragEnd,
	})

	let instance = resolved.instances[0] as TimelineObjectInstance | undefined
	if (!instance) {
		instance = {
			id: 'N/A',
			start: 0,
			end: 0,
			references: [],
		}
	}
	const duration = instance.end ? instance.end - instance.start : null
	const widthPercentage = (duration ? duration / partDuration : 1) * 100 + '%'
	const startValue = Math.max(0, instance.start / partDuration)
	const startPercentage =
		Math.min(
			// Cap to 98, because if 100, the object is not visible
			98,
			startValue * 100
		) + '%'

	const description = describeTimelineObject(obj)

	useEffect(() => {
		const onKey = () => {
			const pressed = sorensen.getPressedKeys()
			setAllowDuplicate(pressed.includes('AltLeft') || pressed.includes('AltRight'))

			// Debounce to let setAllowDuplicate update:
			setTimeout(() => move.updateMove(), 1)
		}
		onKey()

		sorensen.bind('Shift', onKey, {
			up: false,
			global: true,
		})
		sorensen.bind('Shift', onKey, {
			up: true,
			global: true,
		})

		sorensen.bind('Alt', onKey, {
			up: false,
			global: true,
		})
		sorensen.bind('Alt', onKey, {
			up: true,
			global: true,
		})

		sorensen.addEventListener('keycancel', onKey)

		return () => {
			sorensen.unbind('Shift', onKey)
			sorensen.unbind('Alt', onKey)
		}
	}, [hotkeyContext, move])

	const updateSelection = () => {
		if (!selectable) return
		// Prevent selection when dragging:
		if (wasMoving.current) {
			wasMoving.current = false
			return
		} else {
			wasMoving.current = false
		}

		const pressed = sorensen.getPressedKeys()
		const allowMultiSelection =
			pressed.includes('ShiftLeft') ||
			pressed.includes('ShiftRight') ||
			pressed.includes('ControlLeft') ||
			pressed.includes('ControlRight')
		if (allowMultiSelection) {
			store.guiStore.toggleAddSelected({
				type: 'timelineObj',
				groupId: groupId,
				partId: partId,
				timelineObjId: obj.id,
			})
		} else {
			store.guiStore.toggleSelected({
				type: 'timelineObj',
				groupId: groupId,
				partId: partId,
				timelineObjId: obj.id,
			})
		}
	}

	const durationTitle = timelineObjectDurationString(duration)

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

	const isSelected = computed(() =>
		store.guiStore.isSelected({
			type: 'timelineObj',
			groupId: groupId,
			partId: partId,
			timelineObjId: obj.id,
		})
	)

	return (
		<div
			ref={ref}
			className={classNames('timeline-object', description.contentTypeClassNames.join(' '), {
				selectable,
				movable,
				selected: isSelected.get(),
				isAtMinWidth,
				locked,
				warning: warnings && warnings.length > 0,
			})}
			style={{ width: widthPercentage, left: startPercentage }}
			onClick={updateSelection}
			title={warnings && warnings.length > 0 ? warnings.join(', ') : description.label + ' ' + durationTitle}
		>
			<div
				className="handle handle--left"
				onPointerDown={() => {
					if (ref.current) {
						const box = ref.current.getBoundingClientRect()
						if (box.width <= HANDLE_WIDTH * 2) {
							move.onStartMoving()
							setMoveType('whole')
							return
						}
					}
					move.onStartMoving()
					setMoveType('start')
				}}
			/>
			<div
				className="body"
				onPointerDown={() => {
					move.onStartMoving()
					setMoveType('whole')
				}}
			>
				{warnings && warnings.length > 0 && (
					<div className="warning-icon">
						<MdWarningAmber size={18} />
					</div>
				)}
				<div className="title">{description.label}</div>
				<TimelineObjectDuration duration={duration} />
			</div>
			<div
				className="handle handle--right"
				onPointerDown={() => {
					if (ref.current) {
						const box = ref.current.getBoundingClientRect()
						if (box.width <= HANDLE_WIDTH * 2) {
							move.onStartMoving()
							setMoveType('whole')
							return
						}
					}
					move.onStartMoving()
					setMoveType('duration')
				}}
			/>
		</div>
	)
})

function timelineObjectDurationString(duration: number | null): string {
	if (duration === null) return '∞'
	const { h, m, s, ms } = millisecondsToTime(duration)
	const secondTenths = Math.floor(ms / 100)

	let durationTitle = ''
	// if (days) {
	// 	durationTitle += days + 'd'
	// }
	if (h) {
		durationTitle += h + 'h'
	}
	if (m) {
		durationTitle += m + 'm'
	}
	if (s) {
		if (secondTenths) {
			durationTitle += s + '.' + secondTenths + 's'
		} else {
			durationTitle += s + 's'
		}
	}

	return durationTitle
}
function TimelineObjectDuration(props: { duration: number | null }) {
	if (props.duration === null) return <div className="duration">∞</div>
	const { h, m, s, ms } = millisecondsToTime(props.duration)
	const secondTenths = Math.floor(ms / 100)
	return (
		<div className="duration">
			{/* {days ? (
				<>
					<span>{days}</span>
					<span style={{ fontWeight: 300 }}>d</span>
				</>
			) : null} */}
			{h ? (
				<>
					<span>{h}</span>
					<span style={{ fontWeight: 300 }}>h</span>
				</>
			) : null}
			{m ? (
				<>
					<span>{m}</span>
					<span style={{ fontWeight: 300 }}>m</span>
				</>
			) : null}
			{s ? (
				secondTenths ? (
					<>
						<span>{s}</span>
						<span style={{ fontWeight: 300 }}>.</span>
						<span>{secondTenths}</span>
						<span style={{ fontWeight: 300 }}>s</span>
					</>
				) : (
					<>
						<span>{s}</span>
						<span style={{ fontWeight: 300 }}>s</span>
					</>
				)
			) : null}
		</div>
	)
}
