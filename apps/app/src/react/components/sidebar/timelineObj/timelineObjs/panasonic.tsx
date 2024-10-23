import React from 'react'
import { TSRTimelineObj, TimelineContentPanasonicPtzAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib.js'

export const EditTimelineObjPanasonicPtzAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentPanasonicPtzAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
