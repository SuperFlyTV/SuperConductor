import React from 'react'
import { TimelineObjLawoAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

export const EditTimelineObjLawoAny: React.FC<EditTimelineObjProps<TimelineObjLawoAny>> = (props) => {
	return <EditWrapper {...props}>{NOT_IMPLEMENTED_SETTINGS}</EditWrapper>
}
