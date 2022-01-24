import React from 'react'
import { TimelineObjSingularLiveAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjSingularLiveAny: React.FC<{ obj: TimelineObjSingularLiveAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
