import { SELECT_TIMELINE_OBJ_CHANNEL } from '@/ipc/channels'
import classNames from 'classnames'
import React from 'react'
import Timeline from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')

export const Layer: React.FC<{
	layerId: string
	totalDuration: number
	timelineObjs: Timeline.ResolvedTimelineObject[]
	selectedTimelineObjId: string | undefined
}> = (props) => {
	return (
		<div className="layer">
			<div className="layer__content">
				{props.timelineObjs.map((timelineObj) => {
					const start = (timelineObj.enable as any).start
					const duration = (timelineObj.enable as any).duration

					const widthPercentage = (duration / props.totalDuration) * 100 + '%'
					const startPercentage = (start / props.totalDuration) * 100 + '%'

					return (
						<div
							key={timelineObj.id}
							className={classNames({
								object: true,
								[timelineObj.content.type]: true,
								selected: props.selectedTimelineObjId === timelineObj.id,
							})}
							style={{ width: widthPercentage, left: startPercentage }}
							onClick={() => {
								ipcRenderer.send(SELECT_TIMELINE_OBJ_CHANNEL, timelineObj.id)
							}}
						>
							<div className="title">{timelineObj.content.file || timelineObj.content.name}</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
