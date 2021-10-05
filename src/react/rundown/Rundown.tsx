import React from 'react'
import { PlayBtn } from '../inputs/PlayBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { FrameSelector } from './FrameSelector'
import { Layer } from './Layer'

type PropsType = {}

export const Rundown = () => {
	return (
		<div className="rundown">
			<div className="rundown__meta">
				<div className="title">Introduction</div>
				<div className="controls">
					<PlayBtn />
					<QueueBtn />
				</div>
			</div>
			<div className="rundown__timeline">
				<div>
					<FrameSelector frame={10} />
					<div className="layers">
						<Layer />
						<Layer />
						<Layer />
					</div>
				</div>
			</div>
		</div>
	)
}
