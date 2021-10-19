import React, { useRef, useState } from 'react'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import Timeline, { Resolver } from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')
import { PLAY_RUNDOWN_CHANNEL, STOP_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { msToTime } from '@/react/utils/msToTime'

type PropsType = {
	name: string
	timeline: Timeline.TimelineObject[]
	selectedTimelineObjId?: string
}

export const Rundown = (props: PropsType) => {
	const resolvedTimeline = Resolver.resolveTimeline(props.timeline, { time: 0 })
	let maxDuration = 0
	Object.values(resolvedTimeline.objects).forEach((obj) => {
		Object.values(obj.resolved.instances).forEach((instance) => {
			if (instance.end) {
				maxDuration = Math.max(maxDuration, instance.end)
			}
		})
	})

	let startedPlayingTime = 0
	const [isPlaying, setPlaying] = useState(false)
	const [elapsedTime, setElapsedTime] = useState(0)
	const intervalRef = useRef<NodeJS.Timeout>()

	const handlePlayControl = () => {
		if (!isPlaying) {
			handleStart()
		} else {
			handleStop()
		}
	}

	const handleStart = () => {
		setPlaying(true)
		startedPlayingTime = ipcRenderer.sendSync(PLAY_RUNDOWN_CHANNEL, props.timeline)
		intervalRef.current = setInterval(() => {
			updateElapsedTime()
		}, 16)
	}

	const handleStop = () => {
		setPlaying(false)
		setElapsedTime(0)
		ipcRenderer.send(STOP_RUNDOWN_CHANNEL, props.timeline)
		if (intervalRef.current) clearInterval(intervalRef.current)
	}

	const updateElapsedTime = () => {
		const currentTime = Date.now()
		const elapsed = currentTime - startedPlayingTime
		if (elapsed > maxDuration) {
			handleStop()
		}
		setElapsedTime(elapsed)
	}

	return (
		<div className="rundown">
			<div className="rundown__duration">{msToTime(maxDuration)}</div>
			<div className="rundown__meta">
				<div className="title">{props.name}</div>
				<div className="controls">
					<PlayControlBtn mode={isPlaying ? 'stop' : 'play'} onClick={handlePlayControl} />
					<QueueBtn />
				</div>
			</div>
			<div className="rundown__timeline">
				<div>
					<PlayHead percentage={(elapsedTime * 100) / maxDuration + '%'} />
					<div className="layers">
						{Object.entries(resolvedTimeline.layers).map(([layerId, objectIds]) => {
							const objectsOnLayer = objectIds.map((objectId) => resolvedTimeline.objects[objectId])

							return (
								<Layer
									key={layerId}
									totalDuration={maxDuration}
									timelineObjs={objectsOnLayer}
									layerId={layerId}
									selectedTimelineObjId={props.selectedTimelineObjId}
								/>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)
}
