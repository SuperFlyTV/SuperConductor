import React from 'react'
import Timeline from 'superfly-timeline'

type PropsType = {
	timeline: Timeline.TimelineObject
}

export const Layer = (props: PropsType) => {
	const start = 50
	const duration = 200

	return (
		<div className="layer">
			<div className="layer__content" style={{ width: duration, left: start }}>
				<div className="title">{props.timeline.content.file}</div>
			</div>
		</div>
	)
}
