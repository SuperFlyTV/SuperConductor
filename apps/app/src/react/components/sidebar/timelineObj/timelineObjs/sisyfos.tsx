import React from 'react'
import { TSRTimelineObj, TimelineContentSisyfosAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib.js'

export const EditTimelineObjSisyfosAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentSisyfosAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
