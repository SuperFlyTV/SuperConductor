import React from 'react'
import { TimelineObjLawoAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjLawoAny: React.FC<{ obj: TimelineObjLawoAny; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
