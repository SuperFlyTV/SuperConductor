import React from 'react'
import { TSRTimelineObj, TimelineContentAbstractAny } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib.js'

export const EditTimelineObjAbstractAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentAbstractAny>[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<div>No settings available</div>
		</EditWrapper>
	)
}
