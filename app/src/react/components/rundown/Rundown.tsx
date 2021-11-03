import React, { MouseEventHandler, useRef, useState } from 'react'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import Timeline, { Resolver } from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')
import { DELETE_RUNDOWN_CHANNEL, IDeleteRundown, PLAY_RUNDOWN_CHANNEL, STOP_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { msToTime } from '@/react/utils/msToTime'
import { getMappingById } from '@/lib/util'
import { TrashBtn } from '../inputs/TrashBtn'

type PropsType = {
	id: string
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
		const response = ipcRenderer.sendSync(PLAY_RUNDOWN_CHANNEL, props.timeline)
		if (response !== false) {
			startedPlayingTime = response
			setPlaying(true)
			intervalRef.current = setInterval(() => {
				updateElapsedTime()
			}, 16)
		}
	}

	const handleStop = () => {
		setPlaying(false)
		ipcRenderer.send(STOP_RUNDOWN_CHANNEL, props.timeline)
		if (intervalRef.current) clearInterval(intervalRef.current)

		setElapsedTime(0)
	}

	const handleDelete = () => {
		const data: IDeleteRundown = { id: props.id }
		ipcRenderer.send(DELETE_RUNDOWN_CHANNEL, data)
	}

	const updateElapsedTime = () => {
		const currentTime = Date.now()
		const elapsed = currentTime - startedPlayingTime
		if (elapsed > maxDuration) {
			handleStop()
		} else {
			setElapsedTime(elapsed)
		}
	}

	return (
		<div className="rundown">
			<div className="rundown__meta">
				<div className="title">{props.name}</div>
				<div className="controls">
					<PlayControlBtn mode={isPlaying ? 'stop' : 'play'} onClick={handlePlayControl} />
					<QueueBtn />
					<TrashBtn onClick={handleDelete} />
				</div>
			</div>
			<div className="rundown__timeline">
				{elapsedTime ? <div className="rundown__timeline__current-time">{msToTime(elapsedTime)}</div> : ''}
				<div className="rundown__timeline__duration">{msToTime(maxDuration)}</div>
				<div className="layers-wrapper">
					<PlayHead percentage={(elapsedTime * 100) / maxDuration + '%'} />
					<div className="layers">
						{sortLayers(Object.entries(resolvedTimeline.layers)).map(([layerId, objectIds]) => {
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

type TEntries = [string, string[]][]

const sortLayers = (entries: TEntries) => {
	return entries.sort((a, b) => {
		const aLayerId = a[0]
		const bLayerId = b[0]

		const aMappingInfo = getMappingById(aLayerId)
		const bMappingInfo = getMappingById(bLayerId)

		const aLayer = (aMappingInfo as any)?.layer
		const bLayer = (bMappingInfo as any)?.layer

		return bLayer - aLayer
	})
}
