import React, { useContext, useEffect, useMemo, useState } from 'react'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
import { QueueBtn, UnQueueBtn } from '../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import { Resolver } from 'superfly-timeline'
import { msToTime } from '@/lib/msToTime'
import { getMappingById, getResolvedTimelineTotalDuration } from '@/lib/util'
import { TrashBtn } from '../inputs/TrashBtn'
import { Group } from '@/models/rundown/Group'
import { Part } from '@/models/rundown/Part'
import { GroupPlayhead } from '@/lib/playhead'
import classNames from 'classnames'
import { getKeyTracker } from '@/lib/KeyTracker'
import { CountDownHead } from './CountdownHead'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { TSRTimelineObj } from 'timeline-state-resolver-types'

export const PartView: React.FC<{
	rundownId: string
	parentGroup: Group
	part: Part
	playhead: GroupPlayhead | null
}> = ({ rundownId, parentGroup, part, playhead }) => {
	const ipcServer = useContext(IPCServerContext)

	const { maxDuration, resolvedTimeline } = useMemo(() => {
		const resolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0 }
		)
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, resolvedTimeline }
	}, [part.timeline])

	const isPartPlaying = playhead?.partId === part.id
	const isGroupPlaying = !!playhead

	const isActive: 'active' | 'queued' | null = isPartPlaying ? 'active' : isGroupPlaying ? 'queued' : null

	const timesUntilStart = isGroupPlaying && playhead.timeUntilParts[part.id]
	const playheadTime = isPartPlaying ? playhead.playheadTime : 0
	const countDownTime = isPartPlaying ? playhead.partEndTime - playhead.playheadTime : 0

	// Play button:
	const groupNotPlayingAndQueued: boolean =
		parentGroup.playout.startTime === null && parentGroup.playout.partIds.length > 0
	const cannotPlay: boolean = groupNotPlayingAndQueued && parentGroup.playout.partIds[0] !== part.id
	const handleStart = () => {
		ipcServer.playPart({ rundownId: rundownId, groupId: parentGroup.id, partId: part.id })
	}

	// Stop button:
	const cannotStop: boolean = !isGroupPlaying
	const handleStop = () => {
		ipcServer.stopGroup({ rundownId, groupId: parentGroup.id })
	}

	// Queue button:
	const cannotQueue: boolean = isGroupPlaying && playhead.isInRepeating
	const queuedPositions: number[] = []
	parentGroup.playout.partIds.forEach((partId, index) => {
		if (partId === part.id) queuedPositions.push(index)
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
		ipcServer.queuePartGroup({ rundownId, groupId: parentGroup.id, partId: part.id })
	}
	const handleUnQueue = () => {
		ipcServer.unqueuePartGroup({ rundownId, groupId: parentGroup.id, partId: part.id })
	}

	// Delete button:
	const handleDelete = () => {
		ipcServer.deletePart({ rundownId, groupId: parentGroup.id, partId: part.id })
	}

	return (
		<div
			className={classNames('part', {
				active: isActive === 'active',
				queued: isActive === 'queued',
			})}
		>
			<div className="part__meta">
				<div className="title">{part.name}</div>
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
			<div className="part__timeline">
				{playheadTime ? <div className="part__timeline__current-time">{msToTime(playheadTime)}</div> : ''}
				{countDownTime ? <div className="part__timeline__remaining-time">{msToTime(countDownTime)}</div> : ''}
				<div className="part__timeline__duration">{msToTime(part.resolved.duration)}</div>

				<div className="countdown-wrapper">
					{timesUntilStart &&
						timesUntilStart.map((timeUntilStart, index) => (
							<CountDownHead key={index} timeUntilStart={timeUntilStart} />
						))}
				</div>
				<div className="layers-wrapper">
					{playheadTime ? <PlayHead percentage={(playheadTime * 100) / part.resolved.duration + '%'} /> : null}
					<div className="layers">
						{sortLayers(Object.entries(resolvedTimeline.layers)).map(([layerId, objectIds]) => {
							const objectsOnLayer: TSRTimelineObj[] = objectIds.map((objectId) => {
								return resolvedTimeline.objects[objectId] as unknown as TSRTimelineObj
							})

							return (
								<Layer
									key={layerId}
									groupId={parentGroup.id}
									partId={part.id}
									partDuration={maxDuration}
									objectsOnLayer={objectsOnLayer}
									layerId={layerId}
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
