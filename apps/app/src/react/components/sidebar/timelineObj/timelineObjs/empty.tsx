import React from 'react'
import { TimelineObjEmpty } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjEmpty: React.FC<{ objs: TimelineObjEmpty[]; onSave: OnSave }> = ({ objs, onSave }) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<p>No settings</p>
		</EditWrapper>
	)
}
