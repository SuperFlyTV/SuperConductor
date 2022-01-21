import { describeTimelineObject } from '@/lib/TimelineObj'
import { useMovable } from '@/lib/useMovable'
import { TimelineObj } from '@/models/rundown/TimelineObj'
import { GUIContext } from '@/react/contexts/GUI'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { RundownContext } from '@/react/contexts/Rundown'
import { HotkeyContext } from '@/react/contexts/Hotkey'
import classNames from 'classnames'
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'

export const TimelineObject: React.FC<{
	groupId: string
	partId: string
	partDuration: number
	timelineObj: TimelineObj
	resolved: ResolvedTimelineObject['resolved']
}> = ({ groupId, partId, timelineObj, partDuration }) => {
	const { gui, updateGUI } = useContext(GUIContext)
	const dragDelta = useRef(0)
	const rundown = useContext(RundownContext)
	const ipcServer = useContext(IPCServerContext)
	const ref = useRef<HTMLDivElement>(null)
	const [trackWidth, setTrackWidth] = useState(0)
	const [isMoved, deltaX] = useMovable(ref.current)
	const keyTracker = useContext(HotkeyContext)

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

	useEffect(() => {
		if (isMoved) {
			return () => {
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
			}
		}
	}, [isMoved, partDuration, obj.id, rundown.id, partId, groupId, obj.layer, start, duration])

	const widthPercentage = (duration / partDuration) * 100 + '%'
	const startPercentage = Math.max(0, start / partDuration + (isMoved ? dragDelta.current : 0)) * 100 + '%'

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

	return (
		<div
			ref={ref}
			className={classNames('object', description.contentTypeClassNames.join(' '), {
				selected: gui.selectedTimelineObjIds?.includes(obj.id),
				moved: isMoved,
			})}
			style={{ width: widthPercentage, left: startPercentage }}
			onClick={() => {
				updateGUI({
					selectedGroupId: groupId,
					selectedPartId: partId,
					selectedTimelineObjIds:
						gui.selectedGroupId === groupId && gui.selectedPartId === partId && allowMultiSelection
							? [...gui.selectedTimelineObjIds, obj.id]
							: [obj.id],
				})
			}}
		>
			<div className="title">{description.label}</div>
		</div>
	)
}
