import React from 'react'
import { PlayBtn } from '../inputs/PlayBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { FrameSelector } from './FrameSelector'
import { Layer } from './Layer'
import Timeline from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')
import { PLAY_RUNDOWN_CHANNEL } from '@/ipc/channels'

type PropsType = {
	name: string
	duration: string
	timeline: Timeline.TimelineObject[]
}

export const Rundown = (props: PropsType) => {
	const totalDuration = 15000

	return (
		<div className="rundown">
			<div className="rundown__duration">{props.duration}</div>
			<div className="rundown__meta">
				<div className="title">{props.name}</div>
				<div className="controls">
					<PlayBtn
						onClick={() => {
							ipcRenderer.send(PLAY_RUNDOWN_CHANNEL, props.timeline)
						}}
					/>
					<QueueBtn />
				</div>
			</div>
			<div className="rundown__timeline">
				<div>
					<FrameSelector frame={0} />
					<div className="layers">
						{props.timeline.map((item, idx) => {
							return <Layer key={idx} totalDuration={totalDuration} timeline={item} />
						})}
					</div>
				</div>
			</div>
		</div>
	)
}
