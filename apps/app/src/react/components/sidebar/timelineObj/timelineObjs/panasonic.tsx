import React from 'react'
import { TimelineObjPanasonicPtzAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

export const EditTimelineObjPanasonicPtzAny: React.FC<EditTimelineObjProps<TimelineObjPanasonicPtzAny>> = (props) => {
	return <EditWrapper {...props}>{NOT_IMPLEMENTED_SETTINGS}</EditWrapper>
}
