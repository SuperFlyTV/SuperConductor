import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { TimelineObject } from './TimelineObject'

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
