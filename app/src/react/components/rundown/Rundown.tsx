import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
import { QueueBtn, UnQueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import Timeline, { Resolver } from 'superfly-timeline'
const { ipcRenderer } = window.require('electron')
import {
	DELETE_RUNDOWN_CHANNEL,
	IDeleteRundown,
	IPlayRundown,
	PLAY_RUNDOWN_CHANNEL,
	QUEUE_RUNDOWN_GROUP_CHANNEL,
	STOP_GROUP_CHANNEL,
	UNQUEUE_RUNDOWN_GROUP_CHANNEL,
} from '@/ipc/channels'
import { msToTime } from '@/lib/msToTime'
import { getMappingById, getResolvedTimelineTotalDuration } from '@/lib/util'
import { TrashBtn } from '../inputs/TrashBtn'
import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
import { GroupPlayhead } from '@/lib/playhead'
import classNames from 'classnames'
import { getKeyTracker } from '@/lib/KeyTracker'

export const RundownView: React.FC<{
	selectedTimelineObjId: string | undefined
	rundown: RundownModel
	parentGroup: GroupModel
	playhead: GroupPlayhead | null
	isActive: boolean
}> = ({ selectedTimelineObjId, rundown, parentGroup, playhead, isActive }) => {
	const { maxDuration, resolvedTimeline } = useMemo(() => {
		const resolvedTimeline = Resolver.resolveTimeline(rundown.timeline, { time: 0 })
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, resolvedTimeline }
	}, [rundown.timeline])

	const isRundownPlaying = playhead?.rundownId === rundown.id
	const isGroupPlaying = !!playhead
	const playheadTime = isRundownPlaying ? playhead.playheadTime : 0
	const countDownTime = isRundownPlaying ? playhead.rundownEndTime - playhead.playheadTime : 0

	// Play button:
	const groupNotPlayingAndQueued: boolean =
		parentGroup.playout.startTime === null && parentGroup.playout.rundownIds.length > 0
	const cannotPlay: boolean = groupNotPlayingAndQueued && parentGroup.playout.rundownIds[0] !== rundown.id
	const handleStart = () => {
		const data: IPlayRundown = { groupId: parentGroup.id, rundownId: rundown.id }
		ipcRenderer.send(PLAY_RUNDOWN_CHANNEL, data)
	}

	// Stop button:
	const cannotStop: boolean = !isGroupPlaying
	const handleStop = () => {
		ipcRenderer.send(STOP_GROUP_CHANNEL, { groupId: parentGroup.id })
	}

	// Queue button:
	const cannotQueue: boolean = isGroupPlaying && playhead.isInRepeating
	const queuedPositions: number[] = []
	parentGroup.playout.rundownIds.forEach((rundownId, index) => {
		if (rundownId === rundown.id) queuedPositions.push(index)
	})
	const [showUnqueue, setShowUnqueue] = useState(false)
	useEffect(() => {
		const keyTracker = getKeyTracker()
		const onKey = () => {
			setShowUnqueue(keyTracker.isKeyDown('shift'))
		}
		keyTracker.on('key', onKey)
		onKey()

		return () => {
			keyTracker.off('key', onKey)
		}
	})
	const handleQueue = () => {
		ipcRenderer.send(QUEUE_RUNDOWN_GROUP_CHANNEL, { groupId: parentGroup.id, rundownId: rundown.id })
	}
	const handleUnQueue = () => {
		ipcRenderer.send(UNQUEUE_RUNDOWN_GROUP_CHANNEL, { groupId: parentGroup.id, rundownId: rundown.id })
	}

	// Delete button:
	const handleDelete = () => {
		const data: IDeleteRundown = { groupId: parentGroup.id, rundownId: rundown.id }
		ipcRenderer.send(DELETE_RUNDOWN_CHANNEL, data)
	}

	return (
		<div
			className={classNames('rundown', {
				active: isActive,
			})}
		>
			<div className="rundown__meta">
				<div className="title">{rundown.name}</div>
				<div className="controls">
					<PlayControlBtn mode={'play'} onClick={handleStart} disabled={cannotPlay} />
					<PlayControlBtn mode={'stop'} onClick={handleStop} disabled={cannotStop} />
					{showUnqueue ? (
						<UnQueueBtn
							label={queuedPositions.map((index) => index + 1).join(', ')}
							onClick={handleUnQueue}
							disabled={cannotQueue}
						/>
					) : (
						<QueueBtn
							label={queuedPositions.map((index) => index + 1).join(', ')}
							onClick={handleQueue}
							disabled={cannotQueue}
						/>
					)}
					<TrashBtn onClick={handleDelete} />
				</div>
			</div>
			<div className="rundown__timeline">
				{playheadTime ? <div className="rundown__timeline__current-time">{msToTime(playheadTime)}</div> : ''}
				{countDownTime ? <div className="rundown__timeline__remaining-time">{msToTime(countDownTime)}</div> : ''}
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
