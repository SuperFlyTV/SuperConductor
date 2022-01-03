import React from 'react'
import { TimelineObjQuantelAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjQuantelAny: React.FC<{ obj: TimelineObjQuantelAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
