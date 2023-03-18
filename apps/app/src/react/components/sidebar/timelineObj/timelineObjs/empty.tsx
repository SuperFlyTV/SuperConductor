import React from 'react'
import { TimelineObjEmpty } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper } from './lib'

export const EditTimelineObjEmpty: React.FC<EditTimelineObjProps<TimelineObjEmpty>> = (props) => {
	return (
		<EditWrapper {...props}>
			<p>No settings</p>
		</EditWrapper>
	)
}
