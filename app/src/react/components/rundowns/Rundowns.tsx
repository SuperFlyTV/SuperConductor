import React from 'react'
import { AppModel, Rundowns } from '@/models/AppModel'
import { Rundown } from '../rundown/Rundown'

type PropsType = {
	appData: AppModel
	selectedTimelineObjId?: string
}

const Rundowns = (props: PropsType) => {
	return (
		<div className="rundowns">
			{props.appData.rundowns.map((rdOrGroup, idx) => {
				if (rdOrGroup.type === 'rundown') {
					return (
						<Rundown
							key={idx}
							name={rdOrGroup.name}
							timeline={rdOrGroup.timeline}
							selectedTimelineObjId={props.selectedTimelineObjId}
						/>
					)
				} else {
					// Recursively show rundowns and groups
				}
			})}
		</div>
	)
}

export default Rundowns
