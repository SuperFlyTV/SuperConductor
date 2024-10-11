import React from 'react'
import { TSRTimelineObj, TimelineContentVIZMSEAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib.js'

export const EditTimelineObjVIZMSEAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentVIZMSEAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
