import React from 'react'
import { TimelineObjHTTPSendAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjHTTPSendAny: React.FC<{ obj: TimelineObjHTTPSendAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
