import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjUnknown: React.FC<{ obj: TSRTimelineObj; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<p>Unknown/Unsupported timeline-object.</p>
		</EditWrapper>
	)
}
