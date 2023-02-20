import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjUnknown: React.FC<{ objs: TSRTimelineObj[]; onSave: OnSave }> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<p>Unknown/Unsupported timeline-object.</p>
		</EditWrapper>
	)
}
