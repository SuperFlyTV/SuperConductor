import React from 'react'
import { TimelineObjTelemetricsAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

export const EditTimelineObjTelemetricsAny: React.FC<EditTimelineObjProps<TimelineObjTelemetricsAny>> = (props) => {
	return <EditWrapper {...props}>{NOT_IMPLEMENTED_SETTINGS}</EditWrapper>
}
