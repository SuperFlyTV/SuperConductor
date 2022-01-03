import { TimelineObj } from '@/models/rundown/TimelineObj'
import React from 'react'
import { ResolvedTimelineObject } from 'superfly-timeline'
import { TimelineObject } from './TimelineObject'

export const Layer: React.FC<{
	groupId: string
	partId: string
	objectsOnLayer: {
		resolved: ResolvedTimelineObject['resolved']
		timelineObj: TimelineObj
	}[]
	layerId: string
	partDuration: number
}> = ({ layerId, groupId, partId, objectsOnLayer, partDuration }) => {
	return (
		<div className="layer">
			<div className="layer__content">
				{objectsOnLayer.map((objectOnLayer) => {
					return (
						<TimelineObject
							key={objectOnLayer.timelineObj.obj.id}
							groupId={groupId}
							partId={partId}
							timelineObj={objectOnLayer.timelineObj}
							resolved={objectOnLayer.resolved}
							partDuration={partDuration}
						></TimelineObject>
					)
				})}
			</div>
		</div>
	)
}
