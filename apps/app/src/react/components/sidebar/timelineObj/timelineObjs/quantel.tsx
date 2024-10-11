import React from 'react'
import { TSRTimelineObj, TimelineContentQuantelAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib.js'

export const EditTimelineObjQuantelAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentQuantelAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
