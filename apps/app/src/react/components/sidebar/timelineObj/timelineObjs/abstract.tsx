import React from 'react'
import { TimelineObjAbstractAny } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjAbstractAny: React.FC<{ obj: TimelineObjAbstractAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<div>No settings available</div>
		</EditWrapper>
	)
}
