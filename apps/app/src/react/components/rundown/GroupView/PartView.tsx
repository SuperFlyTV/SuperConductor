import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import { PlayHead } from './PlayHead'
import { Layer } from './Layer'
import { ResolvedTimeline, ResolvedTimelineObject, Resolver, ResolverCache } from 'superfly-timeline'
import { allowMovingItemIntoGroup, EMPTY_LAYER_ID_PREFIX, getResolvedTimelineTotalDuration } from '../../../../lib/util'
import { Group } from '../../../../models/rundown/Group'
import { Part } from '../../../../models/rundown/Part'
import classNames from 'classnames'
// import { CountDownHead } from '../CountdownHead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { DragItemTypes, isPartDragItem, PartDragItem } from '../../../api/DragItemTypes'
import { MdOutlineDragIndicator, MdMoreHoriz, MdLockOpen, MdLock, MdRepeatOne } from 'react-icons/md'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { compact, msToTime } from '@shared/lib'
import { Mappings } from 'timeline-state-resolver-types'
import { EmptyLayer } from './EmptyLayer'
import { applyMovementToTimeline, SnapPoint } from '../../../../lib/moveTimelineObj'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { ProjectContext } from '../../../contexts/Project'
import { filterMapping } from '../../../../lib/TSRMappings'
import { Popover, TextField, ToggleButton } from '@mui/material'
import { IoMdEye } from 'react-icons/io'
import { RiEyeCloseLine } from 'react-icons/ri'
import { store } from '../../../mobx/store'
import { PartSubmenu } from './PartSubmenu'
import { LayerName } from './part/LayerName/LayerName'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import { CurrentTime } from './part/CurrentTime/CurrentTime'
import { RemainingTime } from './part/RemainingTime/RemainingTime'
import { CountdownHeads } from './part/CountdownHeads/CountdownHeads'
import { PlayBtn } from '../../inputs/PlayBtn/PlayBtn'
import { PauseBtn } from '../../inputs/PauseBtn/PauseBtn'
import { StopBtn } from '../../inputs/StopBtn/StopBtn'

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
	parentGroupId: string
	parentGroupIndex: number
	part: Part
	partIndex: number
	mappings: Mappings
}> = observer(function PartView({ rundownId, parentGroupId, parentGroupIndex, part, partIndex, mappings }) {
	const ipcServer = useContext(IPCServerContext)
	const gui = store.guiStore
	const timelineObjMove = gui.timelineObjMove
	const hotkeyContext = useContext(HotkeyContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const project = useContext(ProjectContext)
	const layersDivRef = useRef<HTMLDivElement>(null)
	const changedObjects = useRef<{
		[objectId: string]: TimelineObj
	} | null>(null)
	const duplicatedObjects = useRef<{
		[objectId: string]: TimelineObj
	} | null>(null)
	const objectsToMoveToNewLayer = useRef<string[] | null>(null)
	const [trackWidth, setTrackWidth] = useState(0)
	const [bypassSnapping, setBypassSnapping] = useState(false)
	const [waitingForBackendUpdate, setWaitingForBackendUpdate] = useState(false)

	const cache = useRef<ResolverCache>({})

	const [editingPartName, setEditingPartName] = useState(false)
	const [editedName, setEditedName] = useState(part.name)
	useEffect(() => {
		setEditedName(part.name)
	}, [part.name])
	const submitNameEdit = useCallback(() => {
		ipcServer
			.updatePart({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				part: {
					...part,
					name: editedName,
				},
			})
			.catch(handleError)
		setEditingPartName(false)
	}, [editedName, handleError, ipcServer, parentGroupId, part, rundownId])

	const { orgMaxDuration, orgResolvedTimeline, msPerPixel, snapDistanceInMilliseconds } = useMemo(() => {
		const orgResolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0, cache: cache.current }
		)
		/** Max duration for display. Infinite objects are counted to this */
		const orgMaxDuration = getResolvedTimelineTotalDuration(orgResolvedTimeline, true)
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
				gui.updateTimelineObjMove({
					partId: null,
					moveId: undefined,
				})
			}
		}
	}, [waitingForBackendUpdate, part, gui])

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

	const { modifiedTimeline, resolvedTimeline, newChangedObjects, newDuplicatedObjects, newObjectsToMoveToNewLayer } =
		useMemo(() => {
			let modifiedTimeline: TimelineObj[]
			let resolvedTimeline: ResolvedTimeline
			let newChangedObjects: { [objectId: string]: TimelineObj } | null = null
			let newDuplicatedObjects: { [objectId: string]: TimelineObj } | null = null
			let newObjectsToMoveToNewLayer: string[] | null = null

			const dragDelta = timelineObjMove.dragDelta || 0
			const leaderObj = part.timeline.find((obj) => obj.obj.id === timelineObjMove.leaderTimelineObjId)
			const leaderObjOriginalLayerId = leaderObj?.obj.layer
			const leaderObjLayerChanged = leaderObjOriginalLayerId !== timelineObjMove.hoveredLayerId

			if (
				gui.selectedTimelineObjIds.length === 1 &&
				leaderObj &&
				timelineObjMove.hoveredLayerId &&
				timelineObjMove.hoveredLayerId.startsWith(EMPTY_LAYER_ID_PREFIX)
			) {
				// Handle moving a timelineObj to the "new layer" area
				// This type of move is only allowed when a single timelineObj is selected.

				modifiedTimeline = part.timeline
				resolvedTimeline = orgResolvedTimeline
				newObjectsToMoveToNewLayer = [leaderObj.obj.id]
			} else if (
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
					newObjectsToMoveToNewLayer = null
				}
			} else {
				modifiedTimeline = part.timeline
				resolvedTimeline = orgResolvedTimeline
			}

			const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline, false)

			return {
				maxDuration,
				modifiedTimeline,
				resolvedTimeline,
				newChangedObjects,
				newDuplicatedObjects,
				newObjectsToMoveToNewLayer,
			}
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
		if (newObjectsToMoveToNewLayer && !_.isEmpty(newObjectsToMoveToNewLayer)) {
			changedObjects.current = null
		} else if (newChangedObjects && !_.isEmpty(newChangedObjects)) {
			changedObjects.current = newChangedObjects
		}
	}, [newChangedObjects, newObjectsToMoveToNewLayer])

	useEffect(() => {
		if (newObjectsToMoveToNewLayer && !_.isEmpty(newObjectsToMoveToNewLayer)) {
			changedObjects.current = null
		} else if (newDuplicatedObjects && !_.isEmpty(newDuplicatedObjects)) {
			duplicatedObjects.current = newDuplicatedObjects
		}
	}, [newDuplicatedObjects, newObjectsToMoveToNewLayer])

	useEffect(() => {
		objectsToMoveToNewLayer.current = newObjectsToMoveToNewLayer
	}, [newObjectsToMoveToNewLayer])

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
						groupId: parentGroupId,
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
						groupId: parentGroupId,
						timelineObjId: obj.obj.id,
						timelineObj: obj,
					})
					promises.push(promise)
				}
				duplicatedObjects.current = null
			}
			if (objectsToMoveToNewLayer.current) {
				for (const objId of objectsToMoveToNewLayer.current) {
					const promise = ipcServer.moveTimelineObjToNewLayer({
						rundownId: rundownId,
						partId: part.id,
						groupId: parentGroupId,
						timelineObjId: objId,
					})
					promises.push(promise)
				}
				objectsToMoveToNewLayer.current = null
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
	}, [part.id, snapDistanceInMilliseconds, ipcServer, rundownId, parentGroupId, waitingForBackendUpdate, handleError, timelineObjMove.partId, timelineObjMove.moveType, timelineObjMove.wasMoved, timelineObjMove.moveId])

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

		sorensen.addEventListener('keycancel', onKey)

		return () => {
			sorensen.unbind('Shift', onKey)
		}
	}, [hotkeyContext])

	// const timesUntilStart = (playhead.anyPartIsPlaying && playhead.countdowns[part.id]) || null
	// const isActive: 'active' | 'queued' | null = partIsPlaying ? 'active' : timesUntilStart !== null ? 'queued' : null

	// Play button:
	const handleStart = useCallback(() => {
		ipcServer.playPart({ rundownId: rundownId, groupId: parentGroupId, partId: part.id }).catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, rundownId])
	const handlePause = useCallback(() => {
		ipcServer.pausePart({ rundownId: rundownId, groupId: parentGroupId, partId: part.id }).catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, rundownId])

	// Stop button:
	const handleStop = useCallback(() => {
		ipcServer.stopPart({ rundownId, groupId: parentGroupId, partId: part.id }).catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, rundownId])

	// Disable button:
	const toggleDisable = useCallback(() => {
		ipcServer
			.togglePartDisable({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				value: !part.disabled,
			})
			.catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.disabled, part.id, rundownId])

	// Lock button:
	const toggleLock = useCallback(() => {
		ipcServer
			.togglePartLock({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				value: !part.locked,
			})
			.catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, part.locked, rundownId])

	// Loop button:
	const toggleLoop = useCallback(() => {
		ipcServer
			.togglePartLoop({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				value: !part.loop,
			})
			.catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, part.loop, rundownId])

	// Drag n' Drop re-ordering:
	// Adapted from https://react-dnd.github.io/react-dnd/examples/sortable/simple
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

				const parentGroup =
					store.rundownsStore.currentRundown?.groups.find((group) => group.id === parentGroupId) || null

				if (!parentGroup) {
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
				const parentGroup =
					store.rundownsStore.currentRundown?.groups.find((group) => group.id === parentGroupId) || null
				let hoverGroup: Group | null = parentGroup
				const hoverPartId = part.id
				const hoverGroupIndex = parentGroupIndex

				if (parentGroup === null || hoverGroup === null) {
					return
				}

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
				store.rundownsStore.movePartInCurrentRundown(movedItem.partId, hoverGroup?.id ?? null, hoverIndex)

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
		[parentGroupId, parentGroupIndex, partIndex, part.id]
	)
	const [{ isDragging }, drag, preview] = useDrag(
		{
			type: DragItemTypes.PART_ITEM,
			item: (): PartDragItem | null => {
				const parentGroup = store.rundownsStore.currentRundown?.groups.find(
					(group) => group.id === parentGroupId
				)

				if (!parentGroup) {
					return null
				}

				return {
					type: DragItemTypes.PART_ITEM,
					partId: part.id,
					fromGroup: parentGroup,
					toGroupId: parentGroupId,
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
			end: () => {
				store.rundownsStore.commitMovePartInCurrentRundown()?.catch(handleError)
			},
		},
		[part.id, parentGroupId, parentGroupIndex, partIndex]
	)

	useEffect(() => {
		drag(dragRef)
	}, [drag])

	useEffect(() => {
		drop(preview(previewRef))
	}, [drop, preview])

	const [partSubmenuPopoverAnchorEl, setPartSubmenuPopoverAnchorEl] = React.useState<SVGElement | null>(null)
	const closePartSubmenu = useCallback(() => {
		setPartSubmenuPopoverAnchorEl(null)
	}, [])
	const partSubmenuOpen = Boolean(partSubmenuPopoverAnchorEl)

	const groupDisabled =
		computed(
			() => store.rundownsStore.currentRundown?.groups.find((group) => group.id === parentGroupId)?.disabled
		).get() || false
	const groupOrPartDisabled = groupDisabled || part.disabled
	const groupLocked =
		computed(
			() => store.rundownsStore.currentRundown?.groups.find((group) => group.id === parentGroupId)?.locked
		).get() || false
	const groupOrPartLocked = groupLocked || part.locked
	const sortedLayers = useMemo(() => {
		return sortLayers(Object.entries(resolvedTimeline.layers), mappings)
	}, [mappings, resolvedTimeline.layers])
	const firstTimelineObj = modifiedTimeline.find((obj) => obj.obj.id === sortedLayers[0][1][0])
	const firstTimelineObjType = firstTimelineObj && ((firstTimelineObj.obj.content as any).type as string)
	const tabAdditionalClassNames: { [key: string]: boolean } = {}
	if (typeof firstTimelineObjType === 'string') {
		tabAdditionalClassNames[firstTimelineObjType] = true
	}

	return (
		<div
			data-drop-handler-id={handlerId}
			data-part-id={part.id}
			ref={previewRef}
			className={classNames('part', {
				// active: isActive === 'active',
				// queued: isActive === 'queued',
				dragging: isDragging,
				disabled: groupOrPartDisabled,
				locked: groupOrPartLocked,
			})}
		>
			<div className="part__dragArrow" />
			<div className={classNames('part__tab', tabAdditionalClassNames)}>
				<div ref={dragRef} className="part__drag-handle">
					{!groupOrPartLocked && <MdOutlineDragIndicator color="rgba(0, 0, 0, 0.5)" />}
				</div>

				<div className="part__submenu-button">
					<MdMoreHoriz
						color="rgba(255, 255, 255, 0.5)"
						onClick={(event) => {
							setPartSubmenuPopoverAnchorEl(event.currentTarget)
						}}
					/>
				</div>
			</div>
			<div className="part__meta">
				<div className="part__meta__left">
					{!editingPartName && (
						<div
							title={groupOrPartLocked ? part.name : 'Click to edit Part name'}
							className="title"
							onClick={() => {
								if (groupOrPartLocked) {
									return
								}
								setEditingPartName(true)
							}}
						>
							{part.name}
						</div>
					)}

					{editingPartName && (
						<TextField
							size="small"
							value={editedName}
							autoFocus
							variant="standard"
							className="edit-title"
							sx={{ marginTop: '-0.1rem', marginBottom: '0.6rem' }}
							InputProps={{ style: { fontSize: '1.4rem' } }}
							onFocus={(event) => {
								event.target.select()
							}}
							onChange={(event) => {
								setEditedName(event.target.value)
							}}
							onBlur={() => {
								submitNameEdit()
							}}
							onKeyUp={(e) => {
								if (e.key === 'Escape') setEditingPartName(false)
								else if (e.key === 'Enter') submitNameEdit()
							}}
						/>
					)}

					<div className="controls">
						<ToggleButton
							title={
								part.disabled
									? 'Disabledn\n\nClick to enable Part.'
									: 'Disable/Skip Part during playback.'
							}
							value="disabled"
							selected={part.disabled}
							size="small"
							onChange={toggleDisable}
						>
							{part.disabled ? <RiEyeCloseLine size={18} /> : <IoMdEye size={18} />}
						</ToggleButton>
						<ToggleButton
							title={part.locked ? 'Locked.\n\nClick to unlock Part.' : 'Lock Part for editing.'}
							value="locked"
							disabled={groupLocked}
							selected={part.locked}
							size="small"
							onChange={toggleLock}
						>
							{part.locked ? <MdLock size={18} /> : <MdLockOpen size={18} />}
						</ToggleButton>
						<ToggleButton
							title={
								part.loop ? 'Looping.\n\nDisable Looping.' : 'Enable Looping of Part during playout.'
							}
							value="loop"
							disabled={groupOrPartLocked}
							selected={part.loop}
							size="small"
							onChange={toggleLoop}
						>
							<MdRepeatOne size={18} />
						</ToggleButton>
					</div>
				</div>

				<div className="part__meta__right">
					<StopBtn className="part__stop" groupId={parentGroupId} part={part} onClick={handleStop} />
					<PlayBtn className="part__play" groupId={parentGroupId} part={part} onClick={handleStart} />
					<PauseBtn className="part__pause" groupId={parentGroupId} part={part} onClick={handlePause} />
				</div>
			</div>
			<div className="part__dropdown">{/** TODO **/}</div>
			<div className="part__layer-names">
				{sortLayers(Object.entries(resolvedTimeline.layers), mappings).map(([layerId]) => {
					const objectsOnThisLayer = modifiedTimeline.filter((obj) => obj.obj.layer === layerId)

					return (
						<LayerName
							key={layerId}
							layerId={layerId}
							mappings={mappings}
							objectsOnThisLayer={objectsOnThisLayer}
							onSelect={(selectedLayerId) => {
								objectsOnThisLayer.forEach((objectOnThisLayer) => {
									objectOnThisLayer.obj.layer = selectedLayerId
									ipcServer
										.updateTimelineObj({
											rundownId,
											groupId: parentGroupId,
											partId: part.id,
											timelineObj: objectOnThisLayer,
											timelineObjId: objectOnThisLayer.obj.id,
										})
										.catch(handleError)
								})
							}}
						/>
					)
				})}
			</div>
			<div className="part__time">
				<div className="part__time__current-time">
					<CurrentTime groupId={parentGroupId} partId={part.id} />
				</div>

				<div className="part__time__remaining-time">
					<RemainingTime groupId={parentGroupId} partId={part.id} />
				</div>

				<div className="part__time__duration">
					TOTAL <span style={{ fontWeight: 700 }}>{msToTime(part.resolved.duration)}</span>
				</div>
				<div className="part__time__endcap" />
			</div>
			<div className="part__timeline">
				<div className="countdown-wrapper">
					<CountdownHeads groupId={parentGroupId} partId={part.id} />
				</div>
				<div className="layers-wrapper">
					<PlayHead part={part} groupId={parentGroupId} partViewDuration={orgMaxDuration} />
					<div
						className={classNames('layers', {
							moving: timelineObjMove.moveType !== null,
						})}
						ref={layersDivRef}
					>
						{sortedLayers.map(([layerId, objectIds]) => {
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
									groupId={parentGroupId}
									partId={part.id}
									partDuration={orgMaxDuration}
									objectsOnLayer={objectsOnLayer}
									layerId={layerId}
									msPerPixel={msPerPixel}
									locked={groupOrPartLocked}
									mapping={mappings[layerId]}
								/>
							)
						})}

						{!groupOrPartLocked && (
							<EmptyLayer rundownId={rundownId} groupId={parentGroupId} partId={part.id} />
						)}
					</div>
				</div>
			</div>
			<div className="part__endcap"></div>

			<Popover
				open={partSubmenuOpen}
				anchorEl={partSubmenuPopoverAnchorEl}
				onClose={closePartSubmenu}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				<PartSubmenu rundownId={rundownId} groupId={parentGroupId} part={part} locked={groupOrPartLocked} />
			</Popover>
		</div>
	)
})

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
