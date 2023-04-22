import React from 'react'
import { TSRTimelineObj, TimelineContentSingularLiveAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjSingularLiveAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentSingularLiveAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
