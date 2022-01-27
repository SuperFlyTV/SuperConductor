import React from 'react'
import { TimelineObjPanasonicPtzAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjPanasonicPtzAny: React.FC<{ obj: TimelineObjPanasonicPtzAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
