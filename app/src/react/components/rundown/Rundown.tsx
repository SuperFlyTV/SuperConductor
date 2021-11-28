import React, { useContext, useEffect, useMemo, useState } from 'react'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
import { QueueBtn, UnQueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import { Resolver } from 'superfly-timeline'
import { msToTime } from '@/lib/msToTime'
import { getMappingById, getResolvedTimelineTotalDuration } from '@/lib/util'
import { TrashBtn } from '../inputs/TrashBtn'
import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
import { GroupPlayhead } from '@/lib/playhead'
import classNames from 'classnames'
import { getKeyTracker } from '@/lib/KeyTracker'
import { CountDownHead } from './CountdownHead'
import { IPCServerContext } from '@/react/App'

export const RundownView: React.FC<{
	rundown: RundownModel
	parentGroup: GroupModel
	playhead: GroupPlayhead | null
}> = ({ rundown, parentGroup, playhead }) => {
	const ipcServer = useContext(IPCServerContext)

	const { maxDuration, resolvedTimeline } = useMemo(() => {
		const resolvedTimeline = Resolver.resolveTimeline(rundown.timeline, { time: 0 })
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, resolvedTimeline }
	}, [rundown.timeline])

	const isRundownPlaying = playhead?.rundownId === rundown.id
	const isGroupPlaying = !!playhead

	const isActive: 'active' | 'queued' | null = isRundownPlaying ? 'active' : isGroupPlaying ? 'queued' : null

	const timesUntilStart = isGroupPlaying && playhead.timeUntilRundowns[rundown.id]
	const playheadTime = isRundownPlaying ? playhead.playheadTime : 0
	const countDownTime = isRundownPlaying ? playhead.rundownEndTime - playhead.playheadTime : 0

	// Play button:
	const groupNotPlayingAndQueued: boolean =
		parentGroup.playout.startTime === null && parentGroup.playout.rundownIds.length > 0
	const cannotPlay: boolean = groupNotPlayingAndQueued && parentGroup.playout.rundownIds[0] !== rundown.id
	const handleStart = () => {
		ipcServer.playRundown({ groupId: parentGroup.id, rundownId: rundown.id })
	}

	// Stop button:
	const cannotStop: boolean = !isGroupPlaying
	const handleStop = () => {
		ipcServer.stopGroup({ groupId: parentGroup.id })
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
		ipcServer.queueRundownGroup({ groupId: parentGroup.id, rundownId: rundown.id })
	}
	const handleUnQueue = () => {
		ipcServer.unqueueRundownGroup({ groupId: parentGroup.id, rundownId: rundown.id })
	}

	// Delete button:
	const handleDelete = () => {
		ipcServer.deleteRundown({ groupId: parentGroup.id, rundownId: rundown.id })
	}

	return (
		<div
			className={classNames('rundown', {
				active: isActive === 'active',
				queued: isActive === 'queued',
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

				<div className="countdown-wrapper">
					{timesUntilStart &&
						timesUntilStart.map((timeUntilStart, index) => (
							<CountDownHead key={index} timeUntilStart={timeUntilStart} />
						))}
				</div>
				<div className="layers-wrapper">
					{playheadTime ? <PlayHead percentage={(playheadTime * 100) / maxDuration + '%'} /> : null}
					<div className="layers">
						{sortLayers(Object.entries(resolvedTimeline.layers)).map(([layerId, objectIds]) => {
							const objectsOnLayer = objectIds.map((objectId) => resolvedTimeline.objects[objectId])

							return <Layer key={layerId} totalDuration={maxDuration} timelineObjs={objectsOnLayer} layerId={layerId} />
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
