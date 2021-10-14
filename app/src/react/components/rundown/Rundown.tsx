import React, { useEffect, useRef, useState } from 'react'
import { PlayBtn } from '../inputs/PlayBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import Timeline from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')
import { PLAY_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { msToTime } from '@/react/utils/msToTime'

type PropsType = {
	name: string
	timeline: Timeline.TimelineObject[]
}

export const Rundown = (props: PropsType) => {
	const totalDurations = props.timeline.map((item) => {
		return (item.enable as any).start + (item.enable as any).duration
	})
	const maxDuration = Math.max.apply(Math, totalDurations)

	let startedPlayingTime = 0

	const [isPlaying, setPlaying] = useState(false)
	const [elapsedTime, setElapsedTime] = useState(0)
	const intervalRef = useRef<NodeJS.Timeout>()

	const handlePlay = () => {
		if (!isPlaying) {
			setPlaying(true)
			ipcRenderer.send(PLAY_RUNDOWN_CHANNEL, props.timeline)
			startedPlayingTime = Date.now()
			intervalRef.current = setInterval(() => {
				updateElapsedTime()
			}, 16)
		} else {
			setPlaying(false)

			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}

	const handleStart = () => {}
	const handleStop = () => {}

	const updateElapsedTime = () => {
		const currentTime = Date.now()
		const elapsed = currentTime - startedPlayingTime
		// console.log('Elapsed', elapsed)
		if (elapsed > maxDuration) {
			handlePlay()
			return
		}
		setElapsedTime(elapsed)
	}

	return (
		<div className="rundown">
			<div className="rundown__duration">{msToTime(maxDuration)}</div>
			<div className="rundown__meta">
				<div className="title">{props.name}</div>
				<div className="controls">
					<PlayBtn onClick={handlePlay} />
					<QueueBtn />
				</div>
			</div>
			<div className="rundown__timeline">
				<div>
					<PlayHead frame={0} percentage={(elapsedTime * 100) / maxDuration + '%'} />
					<div className="layers">
						{props.timeline.map((item, idx) => {
							return <Layer key={idx} totalDuration={maxDuration} timeline={item} />
						})}
					</div>
				</div>
			</div>
		</div>
	)
}
