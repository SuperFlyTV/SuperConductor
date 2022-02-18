import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import { PlayControlBtn } from '../../inputs/PlayControlBtn'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import { ResolvedTimeline, ResolvedTimelineObject, Resolver, ResolverCache } from 'superfly-timeline'
import { allowMovingItemIntoGroup, getResolvedTimelineTotalDuration } from '../../../../lib/util'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '../../../../models/rundown/Group'
import { Part } from '../../../../models/rundown/Part'
import { GroupPlayData } from '../../../../lib/playhead'
import classNames from 'classnames'
import { CountDownHead } from '../CountdownHead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { DragItemTypes, isPartDragItem, PartDragItem } from '../../../api/DragItemTypes'
import { MdOutlineDragIndicator } from 'react-icons/md'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { compact, msToTime } from '@shared/lib'
import { Mappings } from 'timeline-state-resolver-types'
import { EmptyLayer } from './EmptyLayer'
import { TimelineObjectMoveContext } from '../../../contexts/TimelineObjectMove'
import { GUIContext } from '../../../contexts/GUI'
import { applyMovementToTimeline, SnapPoint } from '../../../../lib/moveTimelineObj'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { TriggerBtn } from '../../inputs/TriggerBtn'
import { ActiveTriggers, activeTriggersToString, Trigger } from '../../../../models/rundown/Trigger'
import { EditTrigger } from '../../inputs/EditTrigger'
import { ProjectContext } from '../../../contexts/Project'
import { filterMapping } from '../../../../lib/TSRMappings'
import { PartMoveContext } from '../../../contexts/PartMove'
import short from 'short-uuid'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'

/**
 * How close an edge of a timeline object needs to be to another edge before it will snap to that edge (in pixels).
 */
const SNAP_DISTANCE_IN_PIXELS = 10

/**
 * A an array of unique identifiers indicating which timelineObj move actions have been handled.
 */
const HANDLED_MOVE_IDS: string[] = []

/**
 * The maximum length of the HANDLED_MOVE_IDS array.
 */
const MAX_HANDLED_MOVE_IDS = 100

export const PartView: React.FC<{
	rundownId: string
	parentGroup: Group
	parentGroupIndex: number
	part: Part
	playhead: GroupPlayData
	mappings: Mappings
}> = ({ rundownId, parentGroup, parentGroupIndex, part, playhead, mappings }) => {
	const ipcServer = useContext(IPCServerContext)
	const { gui } = useContext(GUIContext)
	const { timelineObjMove, updateTimelineObjMove } = useContext(TimelineObjectMoveContext)
	const hotkeyContext = useContext(HotkeyContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const project = useContext(ProjectContext)
	const { partMove, updatePartMove } = useContext(PartMoveContext)
	const layersDivRef = useRef<HTMLDivElement>(null)
	const changedObjects = useRef<{
		[objectId: string]: TimelineObj
	} | null>(null)
	const duplicatedObjects = useRef<{
		[objectId: string]: TimelineObj
	} | null>(null)
	const [trackWidth, setTrackWidth] = useState(0)
	const [bypassSnapping, setBypassSnapping] = useState(false)
	const [waitingForBackendUpdate, setWaitingForBackendUpdate] = useState(false)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const updateTimelineObjMoveRef = useRef(updateTimelineObjMove)
	updateTimelineObjMoveRef.current = updateTimelineObjMove
	const updatePartMoveRef = useRef(updatePartMove)
	updatePartMoveRef.current = updatePartMove
	const partMoveRef = useRef(partMove)
	partMoveRef.current = partMove

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

			const referring: string = [...instance.references, ...timelineObj.resolved.directReferences].join(',')

			snapPoints.push({
				timelineObjId: timelineObj.id,
				time: instance.start,
				expression: `#${timelineObj.id}.start`,
				referring,
			})
			if (instance.end) {
				snapPoints.push({
					timelineObjId: timelineObj.id,
					time: instance.end,
					expression: `#${timelineObj.id}.end`,
					referring,
				})
			}
		}
		snapPoints.sort(sortSnapPoints)
		return snapPoints
	}, [orgResolvedTimeline])

	/**
	 * This useEffect hook is part of a solution to the problem of
	 * timelineObjs briefly flashing back to their original start position
	 * after the user releases their mouse button after performing a drag move.
	 *
	 * In other words: this solves a purely aesthetic problem.
	 */
	useEffect(() => {
		if (waitingForBackendUpdate) {
			// A move has completed and we're waiting for the backend to give us the updated timelineObjs.

			return () => {
				// The backend has updated us (we know because `part` now points to a new object)
				// and we can clear the partId of the `move` context so that we stop displaying
				// timelineObjs with a drag delta applied.
				//
				// This is where a move operation has truly completed, including the backend response.

				setWaitingForBackendUpdate(false)
				updateTimelineObjMoveRef.current({
					partId: null,
					moveId: undefined,
				})
			}
		}
	}, [waitingForBackendUpdate, part])

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
		if (timelineObjMove.moveType && timelineObjMove.partId === part.id && layersDivRef.current) {
			const size = layersDivRef.current.getBoundingClientRect()
			setTrackWidth(size.width)
		}
	}, [timelineObjMove.moveType, timelineObjMove.partId, part.id])

	const { modifiedTimeline, resolvedTimeline, newChangedObjects, newDuplicatedObjects } = useMemo(() => {
		let modifiedTimeline: TimelineObj[]
		let resolvedTimeline: ResolvedTimeline
		let newChangedObjects: { [objectId: string]: TimelineObj } | null = null
		let newDuplicatedObjects: { [objectId: string]: TimelineObj } | null = null

		const dragDelta = timelineObjMove.dragDelta || 0
		const leaderObj = part.timeline.find((obj) => obj.obj.id === timelineObjMove.leaderTimelineObjId)
		const leaderObjOriginalLayerId = leaderObj?.obj.layer
		const leaderObjLayerChanged = leaderObjOriginalLayerId !== timelineObjMove.hoveredLayerId

		if (
			(dragDelta || leaderObjLayerChanged) &&
			timelineObjMove.partId === part.id &&
			leaderObj &&
			timelineObjMove.leaderTimelineObjId &&
			timelineObjMove.moveId !== null &&
			!HANDLED_MOVE_IDS.includes(timelineObjMove.moveId)
		) {
			// Handle movement, snapping

			// Check the the layer movement is legal:
			let moveToLayerId = timelineObjMove.hoveredLayerId
			if (moveToLayerId) {
				const newLayerMapping = project.mappings[moveToLayerId]
				if (!filterMapping(newLayerMapping, leaderObj?.obj)) {
					moveToLayerId = null
					handleError('Unable to move to that layer (incompatible layer type)')
				}
			}

			try {
				const o = applyMovementToTimeline(
					part.timeline,
					orgResolvedTimeline,
					bypassSnapping ? [] : snapPoints || [],
					snapDistanceInMilliseconds,
					dragDelta,
					// The use of wasMoved here helps prevent a brief flash at the
					// end of a move where the moved timelineObjs briefly appear at their pre-move position.
					timelineObjMove.moveType ?? timelineObjMove.wasMoved,
					timelineObjMove.leaderTimelineObjId,
					gui.selectedTimelineObjIds,
					cache.current,
					moveToLayerId,
					Boolean(timelineObjMove.duplicate)
				)
				modifiedTimeline = o.modifiedTimeline
				resolvedTimeline = o.resolvedTimeline
				newChangedObjects = o.changedObjects
				newDuplicatedObjects = o.duplicatedObjects

				if (
					typeof leaderObjOriginalLayerId === 'string' &&
					!resolvedTimeline.layers[leaderObjOriginalLayerId]
				) {
					// If the leaderObj's original layer is now empty, it won't be rendered,
					// making it impossible for the user to move the leaderObj back to whence it came.
					// So, we add an empty layer object here to force it to remain visible.
					resolvedTimeline.layers[leaderObjOriginalLayerId] = []
				}
			} catch (e) {
				// If there was an error applying the movement (for example a circular dependency),
				// reset the movement to the original state:

				console.error('Error when resolving the moved timeline, reverting to original state.')
				console.error(e)

				handleError('There was an error when trying to move')

				modifiedTimeline = part.timeline
				resolvedTimeline = orgResolvedTimeline
				newChangedObjects = null
				newDuplicatedObjects = null
			}
		} else {
			modifiedTimeline = part.timeline
			resolvedTimeline = orgResolvedTimeline
		}

		const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		return { maxDuration, modifiedTimeline, resolvedTimeline, newChangedObjects, newDuplicatedObjects }
	}, [
		timelineObjMove,
		part.timeline,
		part.id,
		project.mappings,
		handleError,
		orgResolvedTimeline,
		bypassSnapping,
		snapPoints,
		snapDistanceInMilliseconds,
		gui.selectedTimelineObjIds,
	])

	useEffect(() => {
		if (newChangedObjects && !_.isEmpty(newChangedObjects)) {
			changedObjects.current = newChangedObjects
		}
	}, [newChangedObjects])

	useEffect(() => {
		if (newDuplicatedObjects && !_.isEmpty(newDuplicatedObjects)) {
			duplicatedObjects.current = newDuplicatedObjects
		}
	}, [newDuplicatedObjects])

	useEffect(() => {
		// Handle when we stop moving:
		if (
			timelineObjMove.partId === part.id &&
			timelineObjMove.moveType === null &&
			timelineObjMove.wasMoved !== null &&
			timelineObjMove.moveId !== null &&
			!waitingForBackendUpdate &&
			!HANDLED_MOVE_IDS.includes(timelineObjMove.moveId)
		) {
			setWaitingForBackendUpdate(true)
			HANDLED_MOVE_IDS.unshift(timelineObjMove.moveId)

			// Prevent the list of handled move IDs from growing infinitely:
			if (HANDLED_MOVE_IDS.length > MAX_HANDLED_MOVE_IDS) {
				HANDLED_MOVE_IDS.length = MAX_HANDLED_MOVE_IDS
			}

			const promises: Promise<unknown>[] = []

			if (changedObjects.current) {
				for (const obj of Object.values(changedObjects.current)) {
					const promise = ipcServer.updateTimelineObj({
						rundownId: rundownId,
						partId: part.id,
						groupId: parentGroup.id,
						timelineObjId: obj.obj.id,
						timelineObj: obj,
					})
					promises.push(promise)
				}
				changedObjects.current = null
			}
			if (duplicatedObjects.current) {
				for (const obj of Object.values(duplicatedObjects.current)) {
					const promise = ipcServer.addTimelineObj({
						rundownId: rundownId,
						partId: part.id,
						groupId: parentGroup.id,
						timelineObjId: obj.obj.id,
						timelineObj: obj,
					})
					promises.push(promise)
				}
				duplicatedObjects.current = null
			}

			Promise.allSettled(promises)
				.then((results) => {
					let foundNonError = false
					for (const result of results) {
						if (result.status === 'rejected') {
							handleError(result.reason)
						} else if (result.status === 'fulfilled') {
							foundNonError = true
						}
					}

					// If every single promise errored, then we need to manually set
					// waitingForBackendUpdate to false here because we won't get any
					// updates from the backend.
					if (!foundNonError) {
						setWaitingForBackendUpdate(false)
					}
				})
				.catch((error) => {
					handleError(error)
					setWaitingForBackendUpdate(false)
				})
		}
	}, [
		part.id,
		snapDistanceInMilliseconds,
		ipcServer,
		rundownId,
		parentGroup.id,
		waitingForBackendUpdate,
		handleError,
		timelineObjMove.partId,
		timelineObjMove.moveType,
		timelineObjMove.wasMoved,
		timelineObjMove.moveId,
	])

	useEffect(() => {
		const sorensen = hotkeyContext.sorensen
		const onKey = () => {
			const pressed = sorensen.getPressedKeys()
			setBypassSnapping(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
		}
		onKey()

		sorensen.bind('Shift', onKey, {
			up: false,
			global: true,
		})
		sorensen.bind('Shift', onKey, {
			up: true,
			global: true,
		})

		return () => {
			sorensen.unbind('Shift', onKey)
		}
	}, [hotkeyContext])

	const [triggerActive, setTriggerActive] = useState<boolean>(false)
	const prevTriggerLength = useRef(0)
	const handleTrigger = useCallback((triggers: ActiveTriggers) => {
		// was something pressed?
		const triggerLength = Object.keys(triggers).length
		if (triggerLength > prevTriggerLength.current) {
			// The length is longer; ie a button was pressed.

			const trigger: Trigger = {
				label: activeTriggersToString(triggers),
				fullIdentifiers: triggers.map((t) => t.fullIdentifier),
				action: 'play',
			}
			console.log('Assign Trigger ', trigger)

			ipcServer
				.setPartTrigger({
					rundownId,
					groupId: parentGroup.id,
					partId: part.id,
					trigger,
					triggerIndex: 9999, // Add a trigger
				})
				.catch(handleError)
		} else if (triggerLength < prevTriggerLength.current) {
			// The length is shorter; ie a button was released.
			// Stop listening for triggers:
			setTriggerActive(false)
		}
		prevTriggerLength.current = triggerLength
	}, [])
	useEffect(() => {
		if (triggerActive) {
			hotkeyContext.triggers.on('trigger', handleTrigger)
		} else {
			hotkeyContext.triggers.off('trigger', handleTrigger)
			prevTriggerLength.current = 0
		}
		return () => {
			hotkeyContext.triggers.off('trigger', handleTrigger)
		}
	}, [hotkeyContext, triggerActive, handleTrigger])
	const onEditTrigger = (index: number, trigger: Trigger | null) => {
		ipcServer
			.setPartTrigger({
				rundownId,
				groupId: parentGroup.id,
				partId: part.id,
				trigger,
				triggerIndex: index,
			})
			.catch(handleError)
	}

	const partPlayhead = playhead.anyPartIsPlaying ? playhead.playheads[part.id] : undefined
	const partIsPlaying = partPlayhead !== undefined

	const timesUntilStart = (playhead.anyPartIsPlaying && playhead.countdowns[part.id]) || null

	const playheadTime = partPlayhead ? partPlayhead.playheadTime : 0
	const countDownTime = partPlayhead
		? partPlayhead.partEndTime - partPlayhead.partStartTime - partPlayhead.playheadTime
		: 0

	const isActive: 'active' | 'queued' | null = partIsPlaying ? 'active' : timesUntilStart !== null ? 'queued' : null

	// Play button:
	const handleStart = () => {
		ipcServer.playPart({ rundownId: rundownId, groupId: parentGroup.id, partId: part.id }).catch(handleError)
	}

	// Stop button:
	const canStop = parentGroup.oneAtATime ? playhead.groupIsPlaying : partIsPlaying
	const handleStop = () => {
		ipcServer.stopPart({ rundownId, groupId: parentGroup.id, partId: part.id }).catch(handleError)
	}

	// Delete button:
	const handleDelete = () => {
		ipcServer.deletePart({ rundownId, groupId: parentGroup.id, partId: part.id }).catch(handleError)
	}

	// TriggerButton
	const handleTriggerBtn = () => {
		setTriggerActive((oldActive) => !oldActive)
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
			canDrop: (movedItem) => {
				if (!isPartDragItem(movedItem)) {
					return false
				}

				return !!allowMovingItemIntoGroup(movedItem.partId, movedItem.fromGroup, parentGroup)
			},
			hover(movedItem, monitor: DropTargetMonitor) {
				if (!isPartDragItem(movedItem)) {
					return
				}

				if (!previewRef.current) {
					return
				}

				let hoverIndex = partIndex
				let hoverGroup: Group | null = parentGroup
				const hoverPartId = part.id
				const hoverGroupIndex = parentGroupIndex

				// Don't replace items with themselves
				if (movedItem.partId === hoverPartId) {
					return
				}

				if (!allowMovingItemIntoGroup(movedItem.partId, movedItem.fromGroup, parentGroup)) {
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

				const isDraggingToNewGroup = movedItem.toGroupId !== hoverGroup.id
				const isDraggingUpFromWithinGroup = !isDraggingToNewGroup && movedItem.position > hoverIndex
				const isDraggingDownFromWithinGroup = !isDraggingToNewGroup && movedItem.position < hoverIndex
				const isDraggingUpFromAnotherGroup = movedItem.toGroupIndex > hoverGroupIndex

				// Dragging downwards
				if (isDraggingDownFromWithinGroup && hoverClientY < hoverMiddleY) {
					return
				}

				// Dragging upwards
				const isHoveringOverLastPartInGroup = hoverIndex === hoverGroup.parts.length - 1
				if (
					isDraggingUpFromAnotherGroup &&
					isHoveringOverLastPartInGroup &&
					!hoverGroup.transparent &&
					hoverClientY > hoverMiddleY
				) {
					hoverIndex += 1
				}
				if (isDraggingUpFromWithinGroup && hoverClientY > hoverMiddleY) {
					return
				}

				// Handle transparent group moves.
				if (hoverGroup.transparent) {
					hoverGroup = null
					hoverIndex = hoverGroupIndex
					if (hoverClientY > hoverMiddleY) {
						hoverIndex = hoverGroupIndex + 1
					}
				}

				// Time to actually perform the action
				updatePartMoveRef.current({
					partId: movedItem.partId,
					fromGroupId: movedItem.fromGroup.id,
					toGroupId: hoverGroup?.id ?? null,
					position: hoverIndex,
				})

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				movedItem.toGroupId = hoverGroup?.id ?? null
				movedItem.toGroupIndex = hoverGroup ? hoverGroupIndex : hoverIndex
				movedItem.toGroupTransparent = !hoverGroup
				movedItem.position = hoverIndex
			},
		},
		[parentGroup, parentGroupIndex, partIndex, part.id]
	)
	const [{ isDragging }, drag, preview] = useDrag(
		{
			type: DragItemTypes.PART_ITEM,
			item: (): PartDragItem => {
				updatePartMoveRef.current({
					moveId: short.generate(),
					done: false,
				})
				return {
					type: DragItemTypes.PART_ITEM,
					partId: part.id,
					fromGroup: parentGroup,
					toGroupId: parentGroup.id,
					toGroupIndex: parentGroupIndex,
					toGroupTransparent: parentGroup.transparent,
					position: partIndex,
				}
			},
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			isDragging: (monitor) => {
				return part.id === monitor.getItem().partId
			},
			end: (draggedItem) => {
				updatePartMoveRef.current({
					partId: draggedItem.partId,
					fromGroupId: draggedItem.fromGroup.id,
					toGroupId: draggedItem.toGroupId,
					position: draggedItem.position,
					done: true,
				})
			},
		},
		[part.id, parentGroup, parentGroupIndex, partIndex]
	)

	useEffect(() => {
		drag(dragRef)
	}, [drag])

	useEffect(() => {
		drop(preview(previewRef))
	}, [drop, preview])

	return (
		<div
			data-drop-handler-id={handlerId}
			data-part-id={part.id}
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
					<PlayControlBtn mode={'stop'} onClick={handleStop} disabled={!canStop} />
					<TrashBtn
						onClick={() => {
							const pressedKeys = hotkeyContext.sorensen.getPressedKeys()
							if (pressedKeys.includes('ControlLeft') || pressedKeys.includes('ControlRight')) {
								// Delete immediately with no confirmation dialog.
								handleDelete()
							} else {
								setDeleteConfirmationOpen(true)
							}
						}}
					/>
					<TriggerBtn onTrigger={handleTriggerBtn} active={triggerActive} title="Assign Trigger" />
				</div>
				<div className="part__triggers">
					{part.triggers.map((trigger, index) => (
						<EditTrigger key={index} trigger={trigger} index={index} onEdit={onEditTrigger} />
					))}
				</div>
			</div>
			<div className="part__layer-names">
				{sortLayers(Object.entries(resolvedTimeline.layers), mappings).map(([layerId]) => {
					return (
						<div className="part__layer-names__name" key={layerId}>
							{mappings[layerId]?.layerName ?? layerId}
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
					<div
						className={classNames('layers', {
							moving: timelineObjMove.moveType !== null,
						})}
						ref={layersDivRef}
					>
						{sortLayers(Object.entries(resolvedTimeline.layers), mappings).map(([layerId, objectIds]) => {
							const objectsOnLayer: {
								resolved: ResolvedTimelineObject['resolved']
								timelineObj: TimelineObj
							}[] = compact(
								objectIds.map((objectId) => {
									const resolvedObj = resolvedTimeline.objects[objectId]
									const timelineObj = modifiedTimeline.find((obj) => obj.obj.id === objectId)

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

						<EmptyLayer rundownId={rundownId} groupId={parentGroup.id} partId={part.id} />
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
						.catch(handleError)
					setPartPropsOpen(false)
				}}
				onDiscarded={() => {
					setPartPropsOpen(false)
				}}
			/>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				body={`Are you sure you want to delete the part "${part.name}"?`}
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
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
