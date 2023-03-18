import React from 'react'
import { TimelineObjSingularLiveAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

export const EditTimelineObjSingularLiveAny: React.FC<EditTimelineObjProps<TimelineObjSingularLiveAny>> = (props) => {
	return <EditWrapper {...props}>{NOT_IMPLEMENTED_SETTINGS}</EditWrapper>
}
