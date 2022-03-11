import React from 'react'
import { TimelineObjEmpty } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjEmpty: React.FC<{ obj: TimelineObjEmpty; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<p>No settings</p>
		</EditWrapper>
	)
}
