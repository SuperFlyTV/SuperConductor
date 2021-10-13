import React from 'react'
import Timeline from 'superfly-timeline'

type PropsType = {
	totalDuration: number
	timeline: Timeline.TimelineObject
}

export const Layer = (props: PropsType) => {
	const start = (props.timeline.enable as any).start
	const duration = (props.timeline.enable as any).duration

	const widthPercentage = (duration / props.totalDuration) * 100 + '%'
	const startPercentage = (start / props.totalDuration) * 100 + '%'

	return (
		<div className="layer">
			<div className="layer__content" style={{ width: widthPercentage, left: startPercentage }}>
				<div className="title">{props.timeline.content.file}</div>
			</div>
		</div>
	)
}
