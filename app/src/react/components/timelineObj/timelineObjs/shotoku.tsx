import React from 'react'
import { TimelineObjShotoku } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjShotoku: React.FC<{ obj: TimelineObjShotoku; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
