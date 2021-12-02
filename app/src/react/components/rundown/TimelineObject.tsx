import { describeTimelineObject } from '@/lib/TimelineObj'
import { useMovable } from '@/lib/useMovable'
import { GUIContext } from '@/react/contexts/GUI'
import classNames from 'classnames'
import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'

export const TimelineObject: React.FC<{
	groupId: string
	partId: string
	partDuration: number
	obj: TSRTimelineObj
}> = ({ groupId, partId, obj, partDuration }) => {
	const { gui, updateGUI } = useContext(GUIContext)
	const ref = useRef<HTMLDivElement>(null)
	const [trackWidth, setTrackWidth] = useState(0)
	const [isMoved, deltaX] = useMovable(ref.current)

	useLayoutEffect(() => {
		if (isMoved && ref.current && ref.current.parentElement) {
			const size = ref.current.parentElement.getBoundingClientRect()
			setTrackWidth(size.width)
		}
	}, [isMoved, ref.current])

	let dragDelta: number | null = null

	if (isMoved) {
		dragDelta = deltaX / trackWidth
	}

	useEffect(() => {
		if (isMoved) {
			return () => {
				// TODO: Commit the result from dragDelta. New enable.start is (obj.enable.start + dragDelta * partDuration)
			}
		}
	}, [isMoved])

	const start = (obj.enable as any).start
	const duration = (obj.enable as any).duration

	const widthPercentage = (duration / partDuration) * 100 + '%'
	const startPercentage = (start / partDuration + Math.max(0, dragDelta ?? 0)) * 100 + '%'

	const description = describeTimelineObject(obj)

	return (
		<div
			ref={ref}
			className={classNames('object', description.contentTypeClassNames.join(' '), {
				selected: gui.selectedTimelineObjId === obj.id,
				moved: isMoved,
			})}
			style={{ width: widthPercentage, left: startPercentage }}
			onClick={() => {
				updateGUI({
					selectedGroupId: groupId,
					selectedPartId: partId,
					selectedTimelineObjId: obj.id,
				})
			}}
		>
			<div className="title">{description.label}</div>
		</div>
	)
}
