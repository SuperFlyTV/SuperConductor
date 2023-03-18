import React from 'react'
import { TimelineObjQuantelAny } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

export const EditTimelineObjQuantelAny: React.FC<EditTimelineObjProps<TimelineObjQuantelAny>> = (props) => {
	return <EditWrapper {...props}>{NOT_IMPLEMENTED_SETTINGS}</EditWrapper>
}
