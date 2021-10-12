import React from 'react'
import { PlayBtn } from '../inputs/PlayBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { FrameSelector } from './FrameSelector'
import { Layer } from './Layer'
import Timeline from 'superfly-timeline'

type PropsType = {
	name: string
	duration: string
	timeline: Timeline.TimelineObject[]
}

export const Rundown = (props: PropsType) => {
	console.log('Rundown props', props)

	return (
		<div className="rundown">
			<div className="rundown__duration">{props.duration}</div>
			<div className="rundown__meta">
				<div className="title">{props.name}</div>
				<div className="controls">
					<PlayBtn />
					<QueueBtn />
				</div>
			</div>
			<div className="rundown__timeline">
				<div>
					<FrameSelector frame={10} />
					<div className="layers">
						{props.timeline.map((item, idx) => {
							return <Layer timeline={item} />
						})}
					</div>
				</div>
			</div>
		</div>
	)
}
