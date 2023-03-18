import React from 'react'
import { TimelineObjAbstractAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper } from './lib'

export const EditTimelineObjAbstractAny: React.FC<EditTimelineObjProps<TimelineObjAbstractAny>> = (props) => {
	return (
		<EditWrapper {...props}>
			<div>No settings available</div>
		</EditWrapper>
	)
}
