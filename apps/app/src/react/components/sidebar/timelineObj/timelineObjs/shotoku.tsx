import React from 'react'
import { TSRTimelineObj, TimelineContentShotoku } from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib.js'

export const EditTimelineObjShotoku: React.FC<{ objs: TSRTimelineObj<TimelineContentShotoku>[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			{NOT_IMPLEMENTED_SETTINGS}
		</EditWrapper>
	)
}
