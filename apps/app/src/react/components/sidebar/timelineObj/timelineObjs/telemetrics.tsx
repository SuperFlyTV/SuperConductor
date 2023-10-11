import React from 'react'
import { TSRTimelineObj, TimelineContentTelemetricsAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjTelemetricsAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentTelemetricsAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
