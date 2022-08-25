import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import sorensen from '@sofie-automation/sorensen'
import { PlayHead } from './PlayHead'
import { Layer, LayerEmpty } from './Layer'
import { ResolvedTimeline, Resolver, ResolverCache, TimelineObjectInstance } from 'superfly-timeline'
import {
	allowMovingPartIntoGroup,
	EMPTY_LAYER_ID_PREFIX,
	getResolvedTimelineTotalDuration,
	MoveTarget,
} from '../../../../lib/util'
import { Group, PlayoutMode } from '../../../../models/rundown/Group'
import classNames from 'classnames'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { DragItemTypes, isPartDragItem, PartDragItem } from '../../../api/DragItemTypes'
import { MdOutlineDragIndicator, MdMoreHoriz, MdLockOpen, MdLock, MdRepeatOne } from 'react-icons/md'
import { TimelineObj, DEFAULT_DURATION } from '../../../../models/rundown/TimelineObj'
import { compact } from '@shared/lib'
import { Mappings } from 'timeline-state-resolver-types'
import { EmptyLayer } from './EmptyLayer'
import { applyMovementToTimeline, SnapPoint } from '../../../../lib/moveTimelineObj'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { filterMapping } from '../../../../lib/TSRMappings'
import { Popover, TextField } from '@mui/material'
import { IoMdEye } from 'react-icons/io'
import { RiEyeCloseLine } from 'react-icons/ri'
import { store } from '../../../mobx/store'
import { PartSubmenu } from './PartSubmenu'
import { LayerName, LayerNameEmpty } from './part/LayerName/LayerName'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import { CurrentTime } from './part/CurrentTime/CurrentTime'
import { RemainingTime } from './part/RemainingTime/RemainingTime'
import { CountdownHeads } from './part/CountdownHeads/CountdownHeads'
import { PlayBtn } from '../../inputs/PlayBtn/PlayBtn'
import { PauseBtn } from '../../inputs/PauseBtn/PauseBtn'
import { PlayButtonData, StopBtn } from '../../inputs/StopBtn/StopBtn'
import { LoggerContext } from '../../../contexts/Logger'
import { useMemoComputedObject } from '../../../mobx/lib'
import { TriggerBtn } from '../../inputs/TriggerBtn/TriggerBtn'
import { TriggersSubmenu } from './part/TriggersSubmenu/TriggersSubmenu'
import { TimelineObjectMove } from '../../../mobx/GuiStore'
import { ToggleBtn } from '../../inputs/ToggleBtn/ToggleBtn'
import { formatDuration } from '../../../../lib/timeLib'
import { DISPLAY_DECIMAL_COUNT } from '../../../constants'
import VisibilitySensor from 'react-visibility-sensor'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'
import { TrashBtn } from '../../inputs/TrashBtn'
import { DuplicateBtn } from '../../inputs/DuplicateBtn'
import { sortSelected } from '../../../lib/clientUtil'
import { sortLayers, timelineObjsOntoLayers } from '../../../../lib/partTimeline'

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
	partId: string
	mappings: Mappings
}> = observer(function PartView({ rundownId, parentGroupId, partId, mappings }) {
	const part = store.rundownsStore.getPart(partId)
	const ipcServer = useContext(IPCServerContext)

	const hotkeyContext = useContext(HotkeyContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const log = useContext(LoggerContext)
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

	const selectable = true
	const isSelected = computed(() =>
		store.guiStore.isSelected({
			type: 'part',
			groupId: parentGroupId,
			partId: partId,
		})
	)
	const updateSelection = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (!selectable) return
		const targetEl = event.target as HTMLElement

		if (
			targetEl.closest('.timeline-object') ||
			targetEl.closest('.layer-names-dropdown') ||
			targetEl.closest('button') ||
			targetEl.closest('input') ||
			targetEl.closest('.editable') ||
			targetEl.closest('.MuiModal-root')
		)
			return

		const pressed = sorensen.getPressedKeys()
		if (pressed.includes('ControlLeft') || pressed.includes('ControlRight')) {
			// Add this part to the selection:
			store.guiStore.toggleAddSelected({
				type: 'part',
				groupId: parentGroupId,
				partId: partId,
			})
		} else if (pressed.includes('ShiftLeft') || pressed.includes('ShiftRight')) {
			// Add all parts between the last selected and this one:
			const mainSelected = store.guiStore.mainSelected
			if (mainSelected && mainSelected.type === 'part') {
				const allPartIds: { partId: string; groupId: string }[] = []
				for (const group of store.rundownsStore.getRundownGroups(rundownId)) {
					for (const part of store.rundownsStore.getGroupParts(group.id)) {
						allPartIds.push({
							groupId: group.id,
							partId: part.id,
						})
					}
				}
				const mainIndex = allPartIds.findIndex((p) => p.partId === mainSelected.partId)
				const thisIndex = allPartIds.findIndex((p) => p.partId === partId)
				if (mainIndex === -1 || thisIndex === -1) return
				if (mainIndex < thisIndex) {
					for (let i = mainIndex + 1; i <= thisIndex; i++) {
						store.guiStore.addSelected({
							type: 'part',
							groupId: allPartIds[i].groupId,
							partId: allPartIds[i].partId,
						})
					}
				} else if (mainIndex > thisIndex) {
					for (let i = mainIndex - 1; i >= thisIndex; i--) {
						store.guiStore.addSelected({
							type: 'part',
							groupId: allPartIds[i].groupId,
							partId: allPartIds[i].partId,
						})
					}
				}
			}
		} else {
			store.guiStore.toggleSelected({
				type: 'part',
				groupId: parentGroupId,
				partId: partId,
			})
		}
	}

	const timelineObjMove = useMemoComputedObject<TimelineObjectMove>(
		() => {
			const objMove = store.guiStore.timelineObjMove

			if (objMove.partId === part.id) {
				return objMove
			} else {
				return {
					moveType: null,
					wasMoved: null,
					partId: null,
					moveId: null,
					hoveredLayerId: null,
				}
			}
		},
		[part.id],
		true
	)

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
					name: editedName,
				},
			})
			.catch(handleError)
		setEditingPartName(false)
	}, [editedName, handleError, ipcServer, parentGroupId, part, rundownId])

	const { orgMaxDuration, orgResolvedTimeline, resolverErrorMessage } = useMemoComputedObject(() => {
		let errorMessage = ''

		const partTimeline = store.rundownsStore.getPartTimeline(partId)
		let orgResolvedTimeline: ResolvedTimeline
		try {
			orgResolvedTimeline = Resolver.resolveTimeline(
				partTimeline.map((o) => o.obj),
				{ time: 0, cache: cache.current }
			)
			/** Max duration for display. Infinite objects are counted to this */
		} catch (e) {
			orgResolvedTimeline = {
				options: {
					time: Date.now(),
				},
				objects: {},
				classes: {},
				layers: {},
				statistics: {
					unresolvedCount: 0,
					resolvedCount: 0,
					resolvedInstanceCount: 0,
					resolvedObjectCount: 0,
					resolvedGroupCount: 0,
					resolvedKeyframeCount: 0,
					resolvingCount: 0,
				},
			}
			errorMessage = `Fatal error in timeline: ${e}`
		}

		return {
			orgResolvedTimeline,
			orgMaxDuration: orgResolvedTimeline ? getResolvedTimelineTotalDuration(orgResolvedTimeline, true) : 0,
			resolverErrorMessage: errorMessage,
		}
		// }, [part.timeline, trackWidth])
	}, [partId])

	const maxDurationAdjusted = orgMaxDuration || DEFAULT_DURATION

	const msPerPixel = maxDurationAdjusted / trackWidth
	const snapDistanceInMilliseconds = msPerPixel * SNAP_DISTANCE_IN_PIXELS

	const snapPoints = useMemo(() => {
		const snapPoints: Array<SnapPoint> = []

		for (const timelineObj of Object.values(orgResolvedTimeline.objects)) {
			if (Array.isArray(timelineObj.enable)) {
				return
			}
			const instance = timelineObj.resolved.instances[0] as TimelineObjectInstance | undefined
			if (!instance) continue

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
				store.guiStore.updateTimelineObjMove({
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

	const { modifiedTimeline, resolvedTimeline, newChangedObjects, newDuplicatedObjects, newObjectsToMoveToNewLayer } =
		useMemoComputedObject(() => {
			let modifiedTimeline: TimelineObj[]
			let resolvedTimeline: ResolvedTimeline
			let newChangedObjects: { [objectId: string]: TimelineObj } | null = null
			let newDuplicatedObjects: { [objectId: string]: TimelineObj } | null = null
			let newObjectsToMoveToNewLayer: string[] | null = null

			const partTimeline = store.rundownsStore.getPartTimeline(partId)

			const dragDelta = timelineObjMove.dragDelta || 0
			const leaderObj = partTimeline.find((obj) => obj.obj.id === timelineObjMove.leaderTimelineObjId)
			const leaderObjOriginalLayerId = leaderObj?.obj.layer
			const leaderObjLayerChanged = leaderObjOriginalLayerId !== timelineObjMove.hoveredLayerId
			if (
				leaderObj &&
				timelineObjMove.moveType === 'whole' &&
				timelineObjMove.hoveredLayerId &&
				timelineObjMove.hoveredLayerId.startsWith(EMPTY_LAYER_ID_PREFIX) &&
				store.guiStore.selected.length === 1
			) {
				// Handle moving a timelineObj to the "new layer" area
				// This type of move is only allowed when a single timelineObj is selected.

				modifiedTimeline = store.rundownsStore.getPartTimeline(partId)
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
				if (moveToLayerId && !moveToLayerId.startsWith(EMPTY_LAYER_ID_PREFIX)) {
					const newLayerMapping = mappings[moveToLayerId]
					if (!filterMapping(newLayerMapping, leaderObj?.obj)) {
						moveToLayerId = null
					}
				}

				const selectedTimelineObjIds = compact(
					store.guiStore.selected.map((s) => (s.type === 'timelineObj' ? s.timelineObjId : undefined))
				)
				try {
					const o = applyMovementToTimeline({
						orgTimeline: partTimeline,
						orgResolvedTimeline: orgResolvedTimeline,
						snapPoints: bypassSnapping ? [] : snapPoints || [],
						snapDistanceInMilliseconds: snapDistanceInMilliseconds,
						dragDelta: dragDelta,

						// The use of wasMoved here helps prevent a brief flash at the
						// end of a move where the moved timelineObjs briefly appear at their pre-move position.
						moveType: timelineObjMove.moveType ?? timelineObjMove.wasMoved,
						leaderTimelineObjId: timelineObjMove.leaderTimelineObjId,
						selectedTimelineObjIds: selectedTimelineObjIds,
						cache: cache.current,
						leaderTimelineObjNewLayer: moveToLayerId,
						duplicate: Boolean(timelineObjMove.duplicate),
					})
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

					log.error('Error when resolving the moved timeline, reverting to original state.')
					log.error(e)

					handleError('There was an error when trying to move')

					modifiedTimeline = partTimeline
					resolvedTimeline = orgResolvedTimeline
					newChangedObjects = null
					newDuplicatedObjects = null
					newObjectsToMoveToNewLayer = null
				}
			} else {
				modifiedTimeline = partTimeline
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
			part.id,
			mappings,
			handleError,
			orgResolvedTimeline,
			bypassSnapping,
			snapPoints,
			snapDistanceInMilliseconds,
			log,
		])

	useEffect(() => {
		if (newObjectsToMoveToNewLayer && !_.isEmpty(newObjectsToMoveToNewLayer)) {
			changedObjects.current = null
		} else if (newChangedObjects && !_.isEmpty(newChangedObjects)) {
			changedObjects.current = newChangedObjects

			if (newDuplicatedObjects && !_.isEmpty(newDuplicatedObjects)) {
				duplicatedObjects.current = newDuplicatedObjects
			} else {
				duplicatedObjects.current = null
			}
		}
	}, [newChangedObjects, newObjectsToMoveToNewLayer, newDuplicatedObjects])

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
			HANDLED_MOVE_IDS.unshift(timelineObjMove.moveId)
			setWaitingForBackendUpdate(true)
			store.guiStore.updateTimelineObjMove({
				saving: true,
			})

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
				promises.push(
					ipcServer.insertTimelineObjs({
						rundownId: rundownId,
						partId: part.id,
						groupId: parentGroupId,
						timelineObjs: Object.values(duplicatedObjects.current),
						target: null,
					})
				)
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
				.then((_results) => {
					// let anyFulfilled = false
					// for (const result of results) {
					// 	if (result.status === 'rejected') {
					// 		handleError(result.reason)
					// 	} else if (result.status === 'fulfilled') {
					// 		anyFulfilled = true
					// 	}
					// }

					// // If every single promise errored, then we need to manually set
					// // waitingForBackendUpdate to false here because we won't get any
					// // updates from the backend.
					// if (!anyFulfilled) {
					// 	setWaitingForBackendUpdate(false)
					// }
					setWaitingForBackendUpdate(false)
				})
				.catch((error) => {
					handleError(error)
					setWaitingForBackendUpdate(false)
				})
		}
	}, [
		//
		part.id,
		snapDistanceInMilliseconds,
		ipcServer,
		rundownId,
		parentGroupId,
		waitingForBackendUpdate,
		handleError,
		timelineObjMove.partId,
		timelineObjMove.moveType,
		timelineObjMove.wasMoved,
		timelineObjMove.moveId,
	])
	useEffect(() => {
		objectsToMoveToNewLayer.current = newObjectsToMoveToNewLayer
	}, [newObjectsToMoveToNewLayer])

	useEffect(() => {
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

	// Trigger button:
	const handleTriggerBtn = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		setTriggersSubmenuPopoverAnchorEl(event.currentTarget)
	}, [])

	// Drag n' Drop re-ordering:
	// Adapted from https://react-dnd.github.io/react-dnd/examples/sortable/simple
	const dragRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop(
		// Use case: Drag Parts over this Part, to insert the Parts above or below this Part
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

				const parentGroup = store.rundownsStore.getGroupInCurrentRundown(parentGroupId) || null

				if (!parentGroup) {
					return false
				}

				for (const movePart of movedItem.parts) {
					if (!allowMovingPartIntoGroup(movePart.partId, movePart.fromGroup, parentGroup)) {
						return false
					}
				}

				return true
			},
			hover(movedItem, monitor: DropTargetMonitor) {
				if (!isPartDragItem(movedItem)) {
					return
				}

				if (!previewRef.current) {
					return
				}

				const parentGroup = store.rundownsStore.getGroupInCurrentRundown(parentGroupId) || null
				let hoverGroup: Group | null = parentGroup
				const hoverPartId = part.id

				if (parentGroup === null || hoverGroup === null) {
					return
				}

				// Don't replace items with themselves
				if (movedItem.parts.find((p) => p.partId === hoverPartId)) {
					return
				}

				for (const movePart of movedItem.parts) {
					if (!allowMovingPartIntoGroup(movePart.partId, movePart.fromGroup, parentGroup)) {
						return false
					}
				}

				// Determine rectangle on screen
				const hoverBoundingRect = previewRef.current?.getBoundingClientRect()

				// Get vertical middle
				const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

				// Determine mouse position
				const clientOffset = monitor.getClientOffset()

				// Get pixels to the top
				const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

				let target: MoveTarget
				if (hoverGroup.transparent) {
					// Handle transparent group moves:
					if (hoverClientY < hoverMiddleY) {
						target = {
							type: 'before',
							id: hoverGroup.id,
						}
					} else {
						target = {
							type: 'after',
							id: hoverGroup.id,
						}
					}
					hoverGroup = null
				} else {
					if (hoverClientY < hoverMiddleY) {
						target = {
							type: 'before',
							id: part.id,
						}
					} else {
						target = {
							type: 'after',
							id: part.id,
						}
					}
				}

				// Time to actually perform the action
				store.rundownsStore.movePartsInCurrentRundown(
					movedItem.parts.map((p) => p.partId),
					hoverGroup?.id ?? null,
					target
				)

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				movedItem.toGroupId = hoverGroup?.id ?? null
				movedItem.target = target
			},
		},
		[parentGroupId, part.id]
	)
	const [{ isDragging }, drag, preview] = useDrag(
		{
			type: DragItemTypes.PART_ITEM,
			item: (): PartDragItem | null => {
				const parentGroup = store.rundownsStore.getGroupInCurrentRundown(parentGroupId)

				if (!parentGroup) {
					return null
				}

				// If this Part isn't included in the current selection, select it:
				if (
					!store.guiStore.isSelected({
						type: 'part',
						groupId: parentGroup.id,
						partId: part.id,
					})
				) {
					store.guiStore.setSelected({
						type: 'part',
						groupId: parentGroup.id,
						partId: part.id,
					})
				}

				const selectedParts = sortSelected(
					rundownId,
					store.rundownsStore,
					store.guiStore.getSelectedOfType('part')
				)
				return {
					type: DragItemTypes.PART_ITEM,
					parts: selectedParts.map((selectedPart) => {
						return {
							partId: selectedPart.partId,
							fromGroup: store.rundownsStore.getGroup(selectedPart.groupId),
						}
					}),

					toGroupId: parentGroupId,
					target: null,
				}
			},
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			isDragging: (monitor) => {
				return !!monitor.getItem().parts.find((p) => p.partId === part.id)
			},
			end: () => {
				store.rundownsStore.commitMovePartInCurrentRundown()?.catch(handleError)
			},
		},
		[part.id, parentGroupId]
	)

	useEffect(() => {
		drag(dragRef)
	}, [drag])

	useEffect(() => {
		drop(preview(previewRef))
	}, [drop, preview])

	// Part Submenu
	const [partSubmenuPopoverAnchorEl, setPartSubmenuPopoverAnchorEl] = React.useState<SVGElement | null>(null)
	const closePartSubmenu = useCallback(() => {
		setPartSubmenuPopoverAnchorEl(null)
	}, [])
	const partSubmenuOpen = Boolean(partSubmenuPopoverAnchorEl)

	// Triggers Submenu
	const [triggersSubmenuPopoverAnchorEl, setTriggersSubmenuPopoverAnchorEl] =
		React.useState<HTMLButtonElement | null>(null)
	const closeTriggersSubmenu = useCallback(() => {
		setTriggersSubmenuPopoverAnchorEl(null)
	}, [])
	const triggersSubmenuOpen = Boolean(triggersSubmenuPopoverAnchorEl)

	const groupDisabled =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.disabled).get() || false
	const groupLocked =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.locked).get() || false
	const groupOrPartDisabled = groupDisabled || part.disabled

	const groupPlayoutMode =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.playoutMode).get() ||
		PlayoutMode.NORMAL

	const groupOrPartLocked = groupLocked || part.locked || false
	const sortedLayers = useMemo(() => {
		return sortLayers(resolvedTimeline.layers, mappings)
	}, [mappings, resolvedTimeline.layers])
	const firstTimelineObj = modifiedTimeline.find((obj) => obj.obj.id === sortedLayers[0]?.objectIds[0])
	const firstTimelineObjType = firstTimelineObj && ((firstTimelineObj.obj.content as any).type as string)
	const tabAdditionalClassNames: { [key: string]: boolean } = {}
	if (typeof firstTimelineObjType === 'string') {
		tabAdditionalClassNames[firstTimelineObjType] = true
	}

	const allActionsForPart = useMemoComputedObject(
		() => {
			return store.rundownsStore.getActionsForPart(partId)
		},
		[partId],
		true
	)

	const timelineLayerObjects = timelineObjsOntoLayers(sortedLayers, resolvedTimeline, modifiedTimeline)

	// This is used to defer initial rendering of some components, in order to improve initial rendering times:
	const [renderEverything, setRenderEverything] = useState(false)
	const onChange = useCallback((isVisible: boolean) => {
		if (isVisible) {
			setRenderEverything(true)
		} else {
			setRenderEverything(false)
		}
	}, [])

	return (
		<VisibilitySensor onChange={onChange} partialVisibility={true}>
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
					selected: isSelected.get(),
					selectable: selectable,
				})}
				onClick={updateSelection}
			>
				<div className="part__selected" />
				<div className="part__dragArrow" />
				<div className={classNames('part__tab', tabAdditionalClassNames)}>
					<>
						<div ref={dragRef} className="part__drag-handle">
							{!groupOrPartLocked && <MdOutlineDragIndicator color="rgba(0, 0, 0, 0.5)" />}
						</div>

						{!groupLocked && (
							<div className="part__submenu-button">
								<MdMoreHoriz
									color="rgba(255, 255, 255, 0.5)"
									onClick={(event) => {
										setPartSubmenuPopoverAnchorEl(event.currentTarget)
									}}
								/>
							</div>
						)}
					</>
				</div>
				<div className="part__meta">
					<div className="part__meta__left">
						{!editingPartName && part.name.length > 0 && (
							<div
								title={groupOrPartLocked ? part.name : 'Click to edit Part name'}
								className="title editable"
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
						{!groupLocked && (
							<div className="controls">
								{renderEverything && (
									<>
										<ToggleBtn
											title={
												part.disabled
													? 'Disabledn\n\nClick to enable Part.'
													: 'Disable/Skip Part during playback.'
											}
											selected={part.disabled}
											size="small"
											onChange={toggleDisable}
										>
											{part.disabled ? <RiEyeCloseLine size={18} /> : <IoMdEye size={18} />}
										</ToggleBtn>
										<ToggleBtn
											title={
												part.locked
													? 'Locked.\n\nClick to unlock Part.'
													: 'Lock Part for editing.'
											}
											disabled={groupLocked}
											selected={part.locked}
											size="small"
											onChange={toggleLock}
										>
											{part.locked ? <MdLock size={18} /> : <MdLockOpen size={18} />}
										</ToggleBtn>
										<ToggleBtn
											title={
												part.loop
													? 'Looping.\n\nDisable Looping.'
													: 'Enable Looping of Part during playout.'
											}
											disabled={groupOrPartLocked}
											selected={part.loop}
											size="small"
											onChange={toggleLoop}
										>
											<MdRepeatOne size={18} />
										</ToggleBtn>
										<TriggerBtn
											onTrigger={handleTriggerBtn}
											title="Open Triggers Submenu"
											locked={groupOrPartLocked}
											triggerCount={allActionsForPart.length}
										/>
									</>
								)}
							</div>
						)}
					</div>

					<div className="part__meta__right">
						<PartControlButtons
							rundownId={rundownId}
							groupId={parentGroupId}
							partId={part.id}
							disabled={part.disabled}
							groupPlayoutMode={groupPlayoutMode}
						/>
					</div>
				</div>
				{!groupLocked && <div className="part__dropdown"></div>}

				<div className="part__layer-names">
					{sortedLayers.map(({ layerId }) => {
						if (renderEverything) {
							return (
								<LayerName
									key={layerId}
									rundownId={rundownId}
									groupId={parentGroupId}
									partId={part.id}
									layerId={layerId}
									mappings={mappings}
									locked={groupOrPartLocked}
								/>
							)
						} else {
							return <LayerNameEmpty key={layerId} />
						}
					})}
				</div>
				<div className="part__time">
					{renderEverything && (
						<>
							<div className="part__time__current-time">
								<CurrentTime groupId={parentGroupId} partId={part.id} />
							</div>

							<div className="part__time__remaining-time">
								<RemainingTime groupId={parentGroupId} partId={part.id} />
							</div>

							<div className="part__time__duration">
								TOTAL{' '}
								<span style={{ fontWeight: 700 }}>
									{formatDuration(part.resolved.duration, DISPLAY_DECIMAL_COUNT)}
								</span>
							</div>
						</>
					)}
				</div>
				<div className="part__timeline">
					<div className="countdown-wrapper">
						<CountdownHeads groupId={parentGroupId} partId={part.id} />
					</div>
					<div className="layers-wrapper">
						{renderEverything && (
							<>
								{resolverErrorMessage && (
									<div className="part__error-overlay">{resolverErrorMessage}</div>
								)}
								<PlayHead partId={part.id} groupId={parentGroupId} partViewDuration={orgMaxDuration} />
							</>
						)}
						<div
							className={classNames('layers', {
								moving: timelineObjMove.moveType !== null,
							})}
							ref={layersDivRef}
						>
							{timelineLayerObjects.map(({ layerId, objectsOnLayer }) => {
								if (renderEverything) {
									return (
										<Layer
											key={layerId}
											rundownId={rundownId}
											groupId={parentGroupId}
											partId={part.id}
											partDuration={maxDurationAdjusted}
											objectsOnLayer={objectsOnLayer}
											layerId={layerId}
											msPerPixel={msPerPixel}
											locked={groupOrPartLocked}
											mapping={mappings[layerId]}
										/>
									)
								} else {
									return <LayerEmpty key={layerId} />
								}
							})}

							{!groupOrPartLocked && (
								<EmptyLayer rundownId={rundownId} groupId={parentGroupId} partId={part.id} />
							)}
						</div>
					</div>
				</div>
				<EndCap groupId={parentGroupId} partId={part.id} />

				<EndCapHover
					rundownId={rundownId}
					groupId={parentGroupId}
					partId={partId}
					partName={part.name}
					groupOrPartLocked={groupOrPartLocked}
					groupLocked={groupLocked}
				/>

				{renderEverything && (
					<>
						<Popover
							open={partSubmenuOpen}
							anchorEl={partSubmenuPopoverAnchorEl}
							onClose={closePartSubmenu}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'left',
							}}
						>
							<PartSubmenu
								rundownId={rundownId}
								groupId={parentGroupId}
								part={part}
								locked={groupOrPartLocked}
							/>
						</Popover>

						<Popover
							open={triggersSubmenuOpen}
							anchorEl={triggersSubmenuPopoverAnchorEl}
							onClose={closeTriggersSubmenu}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'left',
							}}
						>
							<TriggersSubmenu
								rundownId={rundownId}
								groupId={parentGroupId}
								part={part}
								locked={groupOrPartLocked}
								allActionsForPart={allActionsForPart}
							/>
						</Popover>
					</>
				)}
			</div>
		</VisibilitySensor>
	)
})

const PartControlButtons: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	disabled?: boolean
	groupPlayoutMode: PlayoutMode
}> = observer(function PartControlButtons({ rundownId, groupId, partId, disabled }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const handleStart = useCallback(() => {
		ipcServer.playPart({ rundownId, groupId, partId }).catch(handleError)
	}, [handleError, ipcServer, rundownId, groupId, partId])
	const handlePause = useCallback(() => {
		ipcServer.pausePart({ rundownId, groupId, partId }).catch(handleError)
	}, [handleError, ipcServer, rundownId, groupId, partId])
	const handleStop = useCallback(() => {
		ipcServer.stopPart({ rundownId, groupId, partId }).catch(handleError)
	}, [handleError, ipcServer, rundownId, groupId, partId])

	const { groupIsPlaying, anyPartIsPlaying, allPartsArePaused, partIsPlaying, partIsPaused, playheadCount } =
		useMemoComputedObject(
			() => {
				const playData = store.groupPlayDataStore.groups.get(groupId)

				if (!playData) {
					return {
						groupIsPlaying: false,
						anyPartIsPlaying: false,
						allPartsArePaused: false,
						playheadCount: 0,
						partIsPlaying: false,
						partIsPaused: false,
					}
				}
				const playhead = partId && playData.playheads[partId]
				return {
					groupIsPlaying: playData.groupIsPlaying,
					anyPartIsPlaying: playData.anyPartIsPlaying,
					allPartsArePaused: playData.allPartsArePaused,
					playheadCount: Object.keys(playData.playheads).length,
					partIsPlaying: Boolean(partId && partId in playData.playheads), // partIsPlaying: Boolean(playhead),
					partIsPaused: Boolean(playhead && playhead.partPauseTime !== undefined),
				}
			},
			[groupId],
			true
		)

	const { groupDisabled, groupOneAtATime } = useMemoComputedObject(
		() => {
			const group = store.rundownsStore.getGroupWithParts(groupId)

			return {
				groupDisabled: group?.disabled || false,
				groupOneAtATime: group?.oneAtATime || false,
			}
		},
		[groupId],
		true
	)

	const data: PlayButtonData = {
		groupDisabled,
		groupOneAtATime,
		countPlayablePartsInGroup: 0, // not used in parts

		groupIsPlaying,
		anyPartIsPlaying,
		allPartsArePaused,
		partIsPlaying,
		partIsPaused,
		playheadCount,
	}

	return (
		<>
			<StopBtn
				className="part__stop"
				groupId={groupId}
				partId={partId}
				disabled={disabled}
				data={data}
				onClick={handleStop}
			/>
			<PlayBtn
				className="part__play"
				groupId={groupId}
				partId={partId}
				disabled={disabled}
				data={data}
				onClick={handleStart}
			/>
			<PauseBtn
				className="part__pause"
				groupId={groupId}
				partId={partId}
				disabled={disabled}
				data={data}
				onClick={handlePause}
			/>
		</>
	)
})
const EndCap: React.FC<{
	groupId: string
	partId: string
}> = observer(function EndCap({ groupId, partId }) {
	const { groupIsPlaying, partIsPlaying, partIsPaused, partIsPlayNext } = useMemoComputedObject(() => {
		const playData = store.groupPlayDataStore.groups.get(groupId)

		if (!playData) {
			return {
				groupIsPlaying: false,
				partIsPlaying: false,
				partIsPaused: false,
				partIsPlayNext: false,
			}
		}
		const playhead = partId && playData.playheads[partId]
		return {
			groupIsPlaying: Boolean(playData.groupIsPlaying),
			partIsPlaying: Boolean(partId && partId in playData.playheads),
			partIsPaused: Boolean(playhead && playhead.partPauseTime !== undefined),
			partIsPlayNext: Boolean(
				playData.anyPartIsPlaying && playData.countdowns[partId] && playData.countdowns[partId].length > 0
			),
		}
	}, [groupId])

	return (
		<div
			className={classNames('part__endcap', {
				'group-playing': groupIsPlaying,
				'part-playing': partIsPlaying,
				'part-paused': partIsPaused,
				'part-play-next': partIsPlayNext,
			})}
		></div>
	)
})

const sortSnapPoints = (a: SnapPoint, b: SnapPoint): number => {
	if (a.time < b.time) {
		return -1
	}

	if (a.time > b.time) {
		return 1
	}

	return 0
}
const EndCapHover: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	partName: string
	groupOrPartLocked: boolean
	groupLocked: boolean
}> = function EndCapHover({ rundownId, groupId, partId, groupOrPartLocked, groupLocked, partName }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const handleDelete = useCallback(() => {
		ipcServer.deletePart({ rundownId, groupId, partId }).catch(handleError)
	}, [groupId, handleError, ipcServer, partId, rundownId])

	const handleDuplicateBtn = useCallback(() => {
		ipcServer
			.duplicatePart({
				rundownId,
				groupId: groupId,
				partId: partId,
			})
			.catch(handleError)
	}, [groupId, handleError, ipcServer, partId, rundownId])

	return (
		<>
			<div className="end-cap-hover">
				<TrashBtn
					disabled={groupOrPartLocked}
					title={'Delete Part' + (groupOrPartLocked ? ' (disabled due to locked Part or Group)' : '')}
					onClick={() => {
						const pressedKeys = sorensen.getPressedKeys()
						if (pressedKeys.includes('ControlLeft') || pressedKeys.includes('ControlRight')) {
							// Delete immediately with no confirmation dialog.
							handleDelete()
						} else {
							setDeleteConfirmationOpen(true)
						}
					}}
				/>
				<DuplicateBtn title="Duplicate Part" disabled={groupLocked} onClick={handleDuplicateBtn} />
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<div>
					Are you sure you want to delete the part {partName}?
					<br />
					<br />
					(Tip: Hold CTRL when clicking the button to skip this dialog)`
				</div>
			</ConfirmationDialog>
		</>
	)
}
