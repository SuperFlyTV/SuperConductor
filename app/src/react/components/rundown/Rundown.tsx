import React, { useMemo, useRef, useState } from 'react'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
import { QueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import Timeline, { Resolver } from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')
import {
	DELETE_RUNDOWN_CHANNEL,
	IDeleteRundown,
	IPlayRundown,
	PLAY_RUNDOWN_CHANNEL,
	STOP_GROUP_CHANNEL,
} from '@/ipc/channels'
import { msToTime } from '@/lib/msToTime'
import { getMappingById, getResolvedTimelineTotalDuration } from '@/lib/util'
import { TrashBtn } from '../inputs/TrashBtn'
import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
import { GroupPreparedPlayheadData } from '@/lib/playhead'

export const RundownView: React.FC<{
	selectedTimelineObjId: string | undefined
	rundown: RundownModel
	parentGroup: GroupModel
	playheadData: GroupPreparedPlayheadData | null
	playheadTime: number | null
}> = ({ selectedTimelineObjId, rundown, parentGroup, playheadTime }) => {
	const { maxDuration, resolvedTimeline } = useMemo(() => {
		const resolvedTimeline = Resolver.resolveTimeline(rundown.timeline, { time: 0 })
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, resolvedTimeline }
	}, [rundown.timeline])

	let startedPlayingTime = 0

	const elapsedTime = 0
	// const [elapsedTime, setElapsedTime] = useState(0)
	// const intervalRef = useRef<NodeJS.Timeout>()

	const isPlaying = parentGroup.playing?.startRundownId === rundown.id

	const handlePlayControl = () => {
		console.log('handlePlayControl')
		if (isPlaying) {
			handleStop()
		} else {
			handleStart()
		}
	}

	const handleStart = () => {
		const data: IPlayRundown = { groupId: parentGroup.id, rundownId: rundown.id }
		ipcRenderer.send(PLAY_RUNDOWN_CHANNEL, data)

		// const response = ipcRenderer.sendSync(PLAY_RUNDOWN_CHANNEL, data)
		// if (response !== false) {
		// 	startedPlayingTime = response
		// setPlaying(true)
		// intervalRef.current = setInterval(() => {
		// 	updateElapsedTime()
		// }, 16)
		// }
	}

	const handleStop = () => {
		// setPlaying(false)
		ipcRenderer.send(STOP_GROUP_CHANNEL, { groupId: parentGroup.id })
		// if (intervalRef.current) clearInterval(intervalRef.current)

		// setElapsedTime(0)
	}

	const handleDelete = () => {
		const data: IDeleteRundown = { groupId: parentGroup.id, rundownId: rundown.id }
		ipcRenderer.send(DELETE_RUNDOWN_CHANNEL, data)
	}

	// const updateElapsedTime = () => {
	// 	const currentTime = Date.now()
	// 	const elapsed = currentTime - startedPlayingTime
	// 	if (elapsed > maxDuration) {
	// 		if (props.parentGroup && props.parentGroup.loop) {
	// 			startedPlayingTime = currentTime
	// 		} else {
	// 			handleStop()
	// 		}
	// 	} else {
	// 		setElapsedTime(elapsed)
	// 	}
	// }

	return (
		<div className="rundown">
			<div className="rundown__meta">
				<div className="title">{rundown.name}</div>
				<div className="controls">
					<PlayControlBtn mode={isPlaying ? 'stop' : 'play'} onClick={handlePlayControl} />
					<QueueBtn />
					<TrashBtn onClick={handleDelete} />
				</div>
			</div>
			<div className="rundown__timeline">
				{playheadTime ? <div className="rundown__timeline__current-time">{msToTime(playheadTime)}</div> : ''}
				<div className="rundown__timeline__duration">{msToTime(maxDuration)}</div>
				<div className="layers-wrapper">
					{playheadTime ? <PlayHead percentage={(playheadTime * 100) / maxDuration + '%'} /> : null}
					<div className="layers">
						{sortLayers(Object.entries(resolvedTimeline.layers)).map(([layerId, objectIds]) => {
							const objectsOnLayer = objectIds.map((objectId) => resolvedTimeline.objects[objectId])

							return (
								<Layer
									key={layerId}
									totalDuration={maxDuration}
									timelineObjs={objectsOnLayer}
									layerId={layerId}
									selectedTimelineObjId={selectedTimelineObjId}
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
