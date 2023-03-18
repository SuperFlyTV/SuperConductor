import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { EditTimelineObjProps, EditWrapper } from './lib'

export const EditTimelineObjUnknown: React.FC<EditTimelineObjProps<TSRTimelineObj>> = (props) => {
	return (
		<EditWrapper {...props}>
			<p>Unknown/Unsupported timeline-object.</p>
		</EditWrapper>
	)
}
