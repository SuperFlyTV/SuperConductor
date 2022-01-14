import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PlayControlBtn } from '../../inputs/PlayControlBtn'
import { QueueBtn, UnQueueBtn } from '../../inputs/QueueBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import { Resolver } from 'superfly-timeline'
import { msToTime } from '@/lib/msToTime'
import { getMappingById, getResolvedTimelineTotalDuration } from '@/lib/util'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '@/models/rundown/Group'
import { Part } from '@/models/rundown/Part'
import { GroupPlayhead } from '@/lib/playhead'
import classNames from 'classnames'
import { CountDownHead } from '../CountdownHead'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { HotkeyContext } from '@/react/contexts/Hotkey'
import { PartPropertiesDialog } from './PartPropertiesDialog'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { ItemTypes } from '../../../api/ItemTypes'
import { MdOutlineDragIndicator } from 'react-icons/md'

interface DragItem {
	index: number
	id: string
	type: string
}

export const PartView: React.FC<{
	rundownId: string
	parentGroup: Group
	part: Part
	playhead: GroupPlayhead | null
	movePart: (dragIndex: number, hoverIndex: number) => void
}> = ({ rundownId, parentGroup, part, playhead, movePart }) => {
	const ipcServer = useContext(IPCServerContext)
	const keyTracker = useContext(HotkeyContext)

	const [partPropsOpen, setPartPropsOpen] = useState(false)

	const { maxDuration, resolvedTimeline } = useMemo(() => {
		const resolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0 }
		)
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, resolvedTimeline }
	}, [part.timeline])

	const isGroupPlaying = !!playhead
	const isPartPlaying = isGroupPlaying && playhead.partId === part.id

	const timesUntilStart = (isGroupPlaying && playhead.timeUntilParts[part.id]) || null
	const playheadTime = isPartPlaying ? playhead.playheadTime : 0
	const countDownTime = isPartPlaying ? playhead.partEndTime - playhead.playheadTime : 0

	const isActive: 'active' | 'queued' | null = isPartPlaying ? 'active' : timesUntilStart !== null ? 'queued' : null

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
	const cannotQueue: boolean = !!(isGroupPlaying && playhead.isInRepeating)
	const queuedPositions: number[] = []
	parentGroup.playout.partIds.forEach((partId, index) => {
		if (partId === part.id) queuedPositions.push(index)
	})
	const [showUnqueue, setShowUnqueue] = useState(false)
	useEffect(() => {
		const onKey = () => {
			const pressed = keyTracker.getPressedKeys()
			setShowUnqueue(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
		}
		onKey()

		keyTracker.bind('Shift', onKey, {
			up: false,
			global: true,
		})
		keyTracker.bind('Shift', onKey, {
			up: true,
			global: true,
		})

		return () => {
			keyTracker.unbind('Shift', onKey)
		}
	}, [])
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

	// Drag n' Drop re-ordering:
	// Adapted from https://react-dnd.github.io/react-dnd/examples/sortable/simple
	const partIndex = parentGroup.parts.findIndex(({ id }) => id === part.id)
	const dragRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop({
		accept: ItemTypes.PART_ITEM,
		collect(monitor) {
			return {
				handlerId: monitor.getHandlerId(),
			}
		},
		hover(item: DragItem, monitor: DropTargetMonitor) {
			if (!previewRef.current) {
				return
			}
			const dragIndex = item.index
			const hoverIndex = partIndex

			// Don't replace items with themselves
			if (dragIndex === hoverIndex) {
				return
			}

			// Determine rectangle on screen
			const hoverBoundingRect = previewRef.current?.getBoundingClientRect()

			// Get vertical middle
			const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

			// Determine mouse position
			const clientOffset = monitor.getClientOffset()

			// Get pixels to the top
			const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

			// Only perform the move when the mouse has crossed half of the items height
			// When dragging downwards, only move when the cursor is below 50%
			// When dragging upwards, only move when the cursor is above 50%

			// Dragging downwards
			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
				return
			}

			// Dragging upwards
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
				return
			}

			// Time to actually perform the action
			movePart(dragIndex, hoverIndex)

			// Note: we're mutating the monitor item here!
			// Generally it's better to avoid mutations,
			// but it's good here for the sake of performance
			// to avoid expensive index searches.
			item.index = hoverIndex
		},
	})
	const [{ isDragging }, drag, preview] = useDrag({
		type: ItemTypes.PART_ITEM,
		item: () => {
			return { id: part.id, index: partIndex }
		},
		collect: (monitor: any) => ({
			isDragging: monitor.isDragging(),
		}),
	})
	drag(dragRef)
	drop(preview(previewRef))

	return (
		<div
			ref={previewRef}
			className={classNames('part', {
				active: isActive === 'active',
				queued: isActive === 'queued',
				dragging: isDragging,
			})}
		>
			<div ref={dragRef} className="part__drag-handle">
				<MdOutlineDragIndicator />
			</div>
			<div className="part__meta">
				<div className="title" onDoubleClick={() => setPartPropsOpen(true)}>
					{part.name}
				</div>
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
									rundownId={rundownId}
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
			{partPropsOpen && (
				<PartPropertiesDialog
					initial={part}
					onAccepted={() => {
						// ipcServer.newPart({
						// 	rundownId,
						// 	name: part.name,
						// })
						setPartPropsOpen(false)
					}}
					onDiscarded={() => {
						setPartPropsOpen(false)
					}}
				/>
			)}
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
