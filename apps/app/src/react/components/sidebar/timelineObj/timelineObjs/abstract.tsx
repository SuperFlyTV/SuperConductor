import React from 'react'
import { TimelineObjAbstractAny } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjAbstractAny: React.FC<{ objs: TimelineObjAbstractAny[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<div>No settings available</div>
		</EditWrapper>
	)
}
