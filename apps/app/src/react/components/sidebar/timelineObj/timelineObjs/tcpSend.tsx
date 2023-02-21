import React from 'react'
import { TimelineObjTCPSendAny } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjTCPSendAny: React.FC<{ objs: TimelineObjTCPSendAny[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
