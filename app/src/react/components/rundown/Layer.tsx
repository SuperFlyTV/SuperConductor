import { describeTimelineObject } from '@/lib/TimelineObj'
import { TimelineObj } from '@/models/rundown/TimelineObj'
import { GUIContext } from '@/react/contexts/GUI'
import classNames from 'classnames'
import React, { useContext } from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'

export const Layer: React.FC<{
	groupId: string
	partId: string
	objectsOnLayer: TSRTimelineObj[]
	layerId: string
	partDuration: number
}> = ({ layerId, groupId, partId, objectsOnLayer, partDuration }) => {
	return (
		<div className="layer">
			<div className="layer__content">
				{objectsOnLayer.map((obj) => {
					return (
						<TimelineObject
							key={obj.id}
							groupId={groupId}
							partId={partId}
							obj={obj}
							partDuration={partDuration}
						></TimelineObject>
					)
				})}
			</div>
		</div>
	)
}

const TimelineObject: React.FC<{
	groupId: string
	partId: string
	partDuration: number
	obj: TSRTimelineObj
}> = ({ groupId, partId, obj, partDuration }) => {
	const { gui, updateGUI } = useContext(GUIContext)

	const start = (obj.enable as any).start
	const duration = (obj.enable as any).duration

	const widthPercentage = (duration / partDuration) * 100 + '%'
	const startPercentage = (start / partDuration) * 100 + '%'

	const description = describeTimelineObject(obj)

	return (
		<div
			className={classNames({
				object: true,
				[description.contentType]: true,
				selected: gui.selectedTimelineObjId === obj.id,
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
