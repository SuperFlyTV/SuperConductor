import classNames from 'classnames'
import React from 'react'
import Timeline from 'superfly-timeline'

type PropsType = {
	layerId: string
	totalDuration: number
	timelineObjs: Timeline.ResolvedTimelineObject[]
}

export const Layer = (props: PropsType) => {
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
							className={classNames({ object: true, [timelineObj.content.type]: true })}
							style={{ width: widthPercentage, left: startPercentage }}
						>
							<div className="title">{timelineObj.content.file || timelineObj.content.name}</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
