import React from 'react'
import { TimelineObjPharosAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjPharosAny: React.FC<{ obj: TimelineObjPharosAny; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
