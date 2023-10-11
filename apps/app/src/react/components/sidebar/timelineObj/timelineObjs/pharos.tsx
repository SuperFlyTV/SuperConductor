import React from 'react'
import { TSRTimelineObj, TimelineContentPharosAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjPharosAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentPharosAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
