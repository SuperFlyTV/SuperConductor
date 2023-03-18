import React from 'react'
import { TimelineObjVIZMSEAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

export const EditTimelineObjVIZMSEAny: React.FC<EditTimelineObjProps<TimelineObjVIZMSEAny>> = (props) => {
	return <EditWrapper {...props}>{NOT_IMPLEMENTED_SETTINGS}</EditWrapper>
}
