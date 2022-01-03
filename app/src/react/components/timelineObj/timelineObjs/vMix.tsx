import React from 'react'
import { TimelineObjVMixAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjVMixAny: React.FC<{ obj: TimelineObjVMixAny; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
