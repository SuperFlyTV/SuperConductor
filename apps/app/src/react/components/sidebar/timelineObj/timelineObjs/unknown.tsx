import React from 'react'
import { TSRTimelineContent, TSRTimelineObj } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib.js'

export const EditTimelineObjUnknown: React.FC<{ objs: TSRTimelineObj<TSRTimelineContent>[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<p>Unknown/Unsupported timeline-object.</p>
		</EditWrapper>
	)
}
