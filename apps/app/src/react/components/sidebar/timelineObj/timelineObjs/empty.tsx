import React from 'react'
import { TSRTimelineObj, TimelineContentEmpty } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjEmpty: React.FC<{ objs: TSRTimelineObj<TimelineContentEmpty>[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<p>No settings</p>
		</EditWrapper>
	)
}
