import React from 'react'
import { TSRTimelineObj, TimelineContentLawoAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjLawoAny: React.FC<{ objs: TSRTimelineObj<TimelineContentLawoAny>[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
