import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react'
import { PlayControlBtn } from '../../inputs/PlayControlBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import { ResolvedTimeline, ResolvedTimelineObject, Resolver, ResolverCache } from 'superfly-timeline'
import { getCurrentlyPlayingInfo, getResolvedTimelineTotalDuration } from '../../../../lib/util'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '../../../../models/rundown/Group'
import { Part } from '../../../../models/rundown/Part'
import { GroupPlayhead } from '../../../../lib/playhead'
import classNames from 'classnames'
import { CountDownHead } from '../CountdownHead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { DragItemTypes, PartDragItem } from '../../../api/DragItemTypes'
import { MdOutlineDragIndicator } from 'react-icons/md'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { compact, msToTime } from '@shared/lib'
import { Mappings } from 'timeline-state-resolver-types'
import { TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'
import { GUIContext } from '../../../contexts/GUI'
import { applyMovementToTimeline, SnapPoint } from '../../../../lib/moveTimelineObj'

/**
 * How close an edge of a timeline object needs to be to another edge before it will snap to that edge (in pixels).
 */
const SNAP_DISTANCE_IN_PIXELS = 10

export type MovePartFn = (data: {
	dragGroup: Group
	dragPart: Part
	hoverGroup: Group | null
	hoverIndex: number
}) => Promise<Group | undefined>

export const PartView: React.FC<{
	rundownId: string
	parentGroup: Group
	parentGroupIndex: number
	part: Part
	playhead: GroupPlayhead | null
	mappings: Mappings
	movePart: MovePartFn
}> = ({ rundownId, parentGroup, parentGroupIndex, part, playhead, mappings, movePart }) => {
	const ipcServer = useContext(IPCServerContext)
	const { gui } = useContext(GUIContext)
	const { move } = useContext(TimelineObjectMoveContext)
	const layersDivRef = useRef<HTMLDivElement>(null)
	const changedObjects = useRef<TimelineObj[]>([])
	const [trackWidth, setTrackWidth] = useState(0)
	// const updateMoveRef = useRef(updateMove)

	const cache = useRef<ResolverCache>({})

	const [partPropsOpen, setPartPropsOpen] = useState(false)

	const { orgMaxDuration, orgResolvedTimeline, msPerPixel, snapDistanceInMilliseconds } = useMemo(() => {
		const orgResolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0, cache: cache.current }
		)
		const orgMaxDuration = getResolvedTimelineTotalDuration(orgResolvedTimeline)
		const msPerPixel = orgMaxDuration / trackWidth
		const snapDistanceInMilliseconds = msPerPixel * SNAP_DISTANCE_IN_PIXELS

		return { orgResolvedTimeline, orgMaxDuration, msPerPixel, snapDistanceInMilliseconds }
	}, [part.timeline, trackWidth])

	const snapPoints = useMemo(() => {
		const snapPoints: Array<SnapPoint> = []

		for (const timelineObj of Object.values(orgResolvedTimeline.objects)) {
			if (Array.isArray(timelineObj.enable)) {
				return
			}
			const instance = timelineObj.resolved.instances[0]

			snapPoints.push({
				timelineObjId: timelineObj.id,
				time: instance.start,
				expression: `#${timelineObj.id}.start`,
			})
			if (instance.end) {
				snapPoints.push({
					timelineObjId: timelineObj.id,
					time: instance.end,
					expression: `#${timelineObj.id}.end`,
				})
			}
		}
		snapPoints.sort(sortSnapPoints)
		return snapPoints
	}, [orgResolvedTimeline])

	// Initialize trackWidth.
	useLayoutEffect(() => {
		if (layersDivRef.current) {
			const size = layersDivRef.current.getBoundingClientRect()
			setTrackWidth(size.width)
		}
	}, [])

	// Update trackWidth at the end of a move.
	// @TODO: Update trackWidth _during_ a move?
	useLayoutEffect(() => {
		if (move.moveType && layersDivRef.current) {
			const size = layersDivRef.current.getBoundingClientRect()
			setTrackWidth(size.width)
		}
	}, [move.moveType])

	const { resolvedTimeline, newChangedObjects } = useMemo(() => {
		let resolvedTimeline: ResolvedTimeline
		let newChangedObjects: TimelineObj[] = []

		const dragDelta = move.dragDelta
		if (dragDelta && move.leaderTimelineObjId) {
			// Handle snapping

			const o = applyMovementToTimeline(
				part.timeline,
				orgResolvedTimeline,
				snapPoints || [],
				snapDistanceInMilliseconds,
				dragDelta,
				move,
				move.leaderTimelineObjId,
				gui.selectedTimelineObjIds,
				cache.current
			)
			resolvedTimeline = o.resolvedTimeline
			newChangedObjects = o.changedObjects
		} else {
			resolvedTimeline = orgResolvedTimeline
		}

		const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, resolvedTimeline, newChangedObjects }
	}, [move, part.timeline, orgResolvedTimeline, snapPoints, snapDistanceInMilliseconds, gui.selectedTimelineObjIds])

	useEffect(() => {
		if (newChangedObjects.length) {
			changedObjects.current = newChangedObjects
		}
	}, [newChangedObjects])

	useEffect(() => {
		// Handle when we stop moving:
		if (move.moveType === null && move.wasMoved !== null) {
			console.log('Stop moving')

			console.log('o.changedObjects', changedObjects)
			for (const obj of changedObjects.current) {
				ipcServer
					.updateTimelineObj({
						rundownId: rundownId,
						partId: part.id,
						groupId: parentGroup.id,
						timelineObjId: obj.obj.id,
						timelineObj: obj,
					})
					.catch(console.error)
			}
		}
	}, [move, part.id, snapDistanceInMilliseconds, ipcServer, rundownId, parentGroup.id, changedObjects])

	const isGroupPlaying = !!playhead
	const isPartPlaying = isGroupPlaying && playhead.partId === part.id

	const timesUntilStart = (isGroupPlaying && playhead.timeUntilParts[part.id]) || null
	const playheadTime = isPartPlaying ? playhead.playheadTime : 0
	const countDownTime = isPartPlaying ? playhead.partEndTime - playhead.playheadTime : 0

	const isActive: 'active' | 'queued' | null = isPartPlaying ? 'active' : timesUntilStart !== null ? 'queued' : null

	// Play button:
	const handleStart = () => {
		ipcServer.playPart({ rundownId: rundownId, groupId: parentGroup.id, partId: part.id }).catch(console.error)
	}

	// Stop button:
	const cannotStop = !isGroupPlaying
	const handleStop = () => {
		ipcServer.stopGroup({ rundownId, groupId: parentGroup.id }).catch(console.error)
	}

	// Delete button:
	const handleDelete = () => {
		ipcServer.deletePart({ rundownId, groupId: parentGroup.id, partId: part.id }).catch(console.error)
	}

	// Drag n' Drop re-ordering:
	// Adapted from https://react-dnd.github.io/react-dnd/examples/sortable/simple
	const partIndex = parentGroup.parts.findIndex(({ id }) => id === part.id)
	const dragRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop(
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			canDrop: (item: PartDragItem) => {
				// Don't allow dropping into a transparent group.
				if (parentGroup.transparent) {
					return false
				}

				// Don't allow dropping a currently-playing Part onto a Group which is currently playing
				const { partPlayheadData: fromGroupPartPlayheadData } = getCurrentlyPlayingInfo(item.group)
				const movedPartIsPlaying = Boolean(
					fromGroupPartPlayheadData && fromGroupPartPlayheadData.part.id === item.part.id
				)
				const isMovingToNewGroup = item.group.id !== parentGroup.id
				if (movedPartIsPlaying && isMovingToNewGroup && isGroupPlaying) {
					return false
				}

				return true
			},
			async hover(item: PartDragItem, monitor: DropTargetMonitor) {
				if (!previewRef.current) {
					return
				}
				const dragGroup = item.group
				const dragGroupIndex = item.groupIndex
				const dragPart = item.part
				const dragIndex = item.index
				let hoverIndex = partIndex
				let hoverGroup: Group | null = parentGroup
				const hoverGroupIndex = parentGroupIndex

				// Don't allow dropping a currently-playing Part onto a Group which is currently playing
				const { partPlayheadData: fromGroupPartPlayheadData } = getCurrentlyPlayingInfo(dragGroup)
				const movedPartIsPlaying = Boolean(
					fromGroupPartPlayheadData && fromGroupPartPlayheadData.part.id === dragPart.id
				)
				const isMovingToNewGroup = dragGroup.id !== hoverGroup.id
				if (movedPartIsPlaying && isMovingToNewGroup && isGroupPlaying) {
					return
				}

				// Don't replace items with themselves
				if (dragGroup.id === hoverGroup.id && dragIndex === hoverIndex) {
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

				const isDraggingToNewGroup = dragGroup.id !== hoverGroup.id
				const isDraggingUpFromWithinGroup = !isDraggingToNewGroup && dragIndex > hoverIndex
				const isDraggingDownFromWithinGroup = !isDraggingToNewGroup && dragIndex < hoverIndex
				const isDraggingUpFromAnotherGroup = dragGroupIndex > hoverGroupIndex

				// Dragging downwards
				if (isDraggingDownFromWithinGroup && hoverClientY < hoverMiddleY) {
					return
				}

				// Dragging upwards
				const isHoveringOverLastPartInGroup = hoverIndex === hoverGroup.parts.length - 1
				if (isDraggingUpFromAnotherGroup && isHoveringOverLastPartInGroup && hoverClientY > hoverMiddleY) {
					hoverIndex += 1
				}
				if (isDraggingUpFromWithinGroup && hoverClientY > hoverMiddleY) {
					return
				}

				// Handle so-called "transparent group moves".
				if (hoverGroup.transparent) {
					hoverGroup = null
					hoverIndex = hoverGroupIndex
					if (hoverClientY > hoverMiddleY) {
						hoverIndex = hoverGroupIndex + 1
					}
				}

				// Time to actually perform the action
				const newGroup = await movePart({ dragGroup, dragPart, hoverGroup, hoverIndex })
				if (!newGroup) {
					// The backend rejected the move, so do nothing.
					return
				}

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				item.index = hoverIndex
				item.group = newGroup
			},
		},
		[parentGroup, parentGroupIndex, partIndex]
	)
	const [{ isDragging }, drag, preview] = useDrag({
		type: DragItemTypes.PART_ITEM,
		item: (): PartDragItem => {
			return {
				type: DragItemTypes.PART_ITEM,
				group: parentGroup,
				groupIndex: parentGroupIndex,
				part: part,
				index: partIndex,
			}
		},
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
		isDragging: (monitor) => {
			return part.id === monitor.getItem().part.id
		},
	})
	drag(dragRef)
	drop(preview(previewRef))

	return (
		<div
			data-handler-id={handlerId}
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
				<div
					className="title"
					onDoubleClick={() => {
						setPartPropsOpen(true)
					}}
				>
					{part.name}
				</div>
				<div className="controls">
					<PlayControlBtn mode={'play'} onClick={handleStart} />
					<PlayControlBtn mode={'stop'} onClick={handleStop} disabled={cannotStop} />
					<TrashBtn onClick={handleDelete} />
				</div>
			</div>
			<div className="part__layer-names">
				{sortLayers(Object.entries(resolvedTimeline.layers), mappings).map(([layerId]) => {
					return (
						<div className="part__layer-names__name" key={layerId}>
							{mappings[layerId].layerName ?? layerId}
						</div>
					)
				})}
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
					{playheadTime ? (
						<PlayHead percentage={(playheadTime * 100) / part.resolved.duration + '%'} />
					) : null}
					<div className="layers" ref={layersDivRef}>
						{sortLayers(Object.entries(resolvedTimeline.layers), mappings).map(([layerId, objectIds]) => {
							const objectsOnLayer: {
								resolved: ResolvedTimelineObject['resolved']
								timelineObj: TimelineObj
							}[] = compact(
								objectIds.map((objectId) => {
									const resolvedObj = resolvedTimeline.objects[objectId]
									const timelineObj = part.timeline.find((obj) => obj.obj.id === objectId)

									if (resolvedObj && timelineObj) {
										return {
											resolved: resolvedObj.resolved,
											timelineObj: timelineObj,
										}
									}
								})
							)

							return (
								<Layer
									key={layerId}
									rundownId={rundownId}
									groupId={parentGroup.id}
									partId={part.id}
									partDuration={orgMaxDuration}
									objectsOnLayer={objectsOnLayer}
									layerId={layerId}
									msPerPixel={msPerPixel}
								/>
							)
						})}
					</div>
				</div>
			</div>

			<PartPropertiesDialog
				initial={part}
				open={partPropsOpen}
				title="Edit Part"
				acceptLabel="Save"
				onAccepted={(updatedPart) => {
					ipcServer
						.updatePart({
							rundownId,
							groupId: parentGroup.id,
							partId: part.id,
							part: {
								...part,
								name: updatedPart.name,
							},
						})
						.catch(console.error)
					setPartPropsOpen(false)
				}}
				onDiscarded={() => {
					setPartPropsOpen(false)
				}}
			/>
		</div>
	)
}

type TEntries = [string, string[]][]

const sortLayers = (entries: TEntries, mappings: Mappings) => {
	return entries.sort((a, b) => {
		const aLayerId = a[0]
		const bLayerId = b[0]

		const aMappingInfo = mappings[aLayerId]
		const bMappingInfo = mappings[bLayerId]

		const aLayer = aMappingInfo?.layerName ?? ''
		const bLayer = bMappingInfo?.layerName ?? ''

		if (aLayer > bLayer) {
			return 1
		}

		if (aLayer < bLayer) {
			return -1
		}

		return 0
	})
}

const sortSnapPoints = (a: SnapPoint, b: SnapPoint): number => {
	if (a.time < b.time) {
		return -1
	}

	if (a.time > b.time) {
		return 1
	}

	return 0
}
