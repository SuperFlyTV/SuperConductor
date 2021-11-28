import { GUIContext } from '@/react/App'
import classNames from 'classnames'
import React, { useContext } from 'react'
import Timeline from 'superfly-timeline'

export const Layer: React.FC<{
	layerId: string
	totalDuration: number
	timelineObjs: Timeline.ResolvedTimelineObject[]
}> = (props) => {
	const { gui, updateGUI } = useContext(GUIContext)
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
								selected: gui.selectedTimelineObjId === timelineObj.id,
							})}
							style={{ width: widthPercentage, left: startPercentage }}
							onClick={() => {
								updateGUI({ selectedTimelineObjId: timelineObj.id })
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
