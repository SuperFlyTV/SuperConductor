import React, { useContext, useLayoutEffect, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import sorensen from '@sofie-automation/sorensen'
import {
	ResolvedTimeline,
	ResolvedTimelineObject,
	Resolver,
	ResolverCache,
	TimelineObjectInstance,
} from 'superfly-timeline'
import { allowMovingPartIntoGroup, getResolvedTimelineTotalDuration, MoveTarget } from '../../../../lib/util'
import { Group, PlayoutMode } from '../../../../models/rundown/Group'
import classNames from 'classnames'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { DragItemTypes, isPartDragItem, PartDragItem } from '../../../api/DragItemTypes'
import { MdOutlineDragIndicator, MdMoreHoriz } from 'react-icons/md'
import { TimelineObj, DEFAULT_DURATION } from '../../../../models/rundown/TimelineObj'
import { Mappings } from 'timeline-state-resolver-types'
import { SnapPoint } from '../../../../lib/moveTimelineObj'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import { LoggerContext } from '../../../contexts/Logger'
import { useMemoComputedObject } from '../../../mobx/lib'
import { TimelineObjectMove } from '../../../mobx/GuiStore'
import { ToggleBtn } from '../../inputs/ToggleBtn/ToggleBtn'
import VisibilitySensor from 'react-visibility-sensor'
import { sortSelected } from '../../../lib/clientUtil'
import { sortLayers, timelineObjsOntoLayers } from '../../../../lib/partTimeline'
import {
	PartTimeline,
	PartControlButtons,
	PartEditControls,
	usePartModifiedTimeline,
	selectPart,
	sortSnapPoints,
} from './PartView'
import { TrashBtn } from '../../inputs/TrashBtn'
import { DuplicateBtn } from '../../inputs/DuplicateBtn'
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

export const PartButtonView: React.FC<{
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

	const [extended, setExtended] = useState(false)

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

		selectPart(rundownId, parentGroupId, partId)
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
			orgMaxDuration: orgResolvedTimeline
				? part.duration ?? getResolvedTimelineTotalDuration(orgResolvedTimeline, true)
				: 0,
			resolverErrorMessage: errorMessage,
		}
		// }, [part.timeline, trackWidth])
	}, [partId, part.duration])

	const maxDurationAdjusted = orgMaxDuration || DEFAULT_DURATION

	const msPerPixel = maxDurationAdjusted / trackWidth
	const snapDistanceInMilliseconds = msPerPixel * SNAP_DISTANCE_IN_PIXELS

	const snapPoints = useMemo(() => {
		const snapPoints: Array<SnapPoint> = []

		for (const timelineObj of Object.values<ResolvedTimelineObject>(orgResolvedTimeline.objects)) {
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
		usePartModifiedTimeline(
			timelineObjMove,
			part.id,
			mappings,
			handleError,
			orgResolvedTimeline,
			bypassSnapping,
			snapPoints,
			snapDistanceInMilliseconds,
			log
		)

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
				for (const obj of Object.values<TimelineObj>(changedObjects.current)) {
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
						timelineObjs: Object.values<TimelineObj>(duplicatedObjects.current),
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
			sorensen.removeEventListener('keycancel', onKey)
		}
	}, [hotkeyContext])

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
		console.log('dragRef', dragRef.current)
		drag(dragRef)
	}, [drag])

	useEffect(() => {
		drop(preview(previewRef))
	}, [drop, preview])

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

	const { partLabel, tabAdditionalClassNames } = useMemoComputedObject(() => {
		const partLabel = part.name || ''
		const tabAdditionalClassNames: { [key: string]: boolean } = {}

		const firstTimelineObj = modifiedTimeline.find((obj) => obj.obj.id === sortedLayers[0]?.objectIds[0])
		if (firstTimelineObj) {
			const firstTimelineObjType = (firstTimelineObj.obj.content as any).type as string
			if (typeof firstTimelineObjType === 'string') {
				tabAdditionalClassNames[firstTimelineObjType] = true
			}

			// const objMapping = mappings[firstTimelineObj.obj.layer]
			// const deviceId: TSRDeviceId = protectString(objMapping?.deviceId)
			// if (objMapping) {
			// 	const deviceMetadata = store.resourcesAndMetadataStore.getMetadata(deviceId)
			// 	const description = describeTimelineObject(firstTimelineObj.obj, deviceMetadata)

			// 	partLabel = part.name || description.label || ''
			// }
		}

		return {
			partLabel,
			tabAdditionalClassNames,
		}
	}, [modifiedTimeline])

	const allActionsForPart = useMemoComputedObject(
		() => {
			return store.rundownsStore.getActionsForPart(partId)
		},
		[partId],
		true
	)

	const timelineLayerObjects = timelineObjsOntoLayers(sortedLayers, resolvedTimeline, modifiedTimeline)

	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const handleDelete = useCallback(() => {
		ipcServer.deletePart({ rundownId, groupId: parentGroupId, partId }).catch(handleError)
	}, [parentGroupId, handleError, ipcServer, partId, rundownId])

	const handleDuplicateBtn = useCallback(() => {
		ipcServer
			.duplicatePart({
				rundownId,
				groupId: parentGroupId,
				partId: partId,
			})
			.catch(handleError)
	}, [parentGroupId, handleError, ipcServer, partId, rundownId])

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
				className={classNames('part-button', {
					// active: isActive === 'active',
					// queued: isActive === 'queued',
					dragging: isDragging,
					disabled: groupOrPartDisabled,
					locked: groupOrPartLocked,
					selected: isSelected.get(),
					selectable: selectable,
					extended: extended,
				})}
				onClick={updateSelection}
			>
				<div className={classNames('part-button__header', tabAdditionalClassNames)}>
					<div className="part-button__header__controls">
						{!groupLocked && (
							<div ref={dragRef} className="part-button__drag-handle">
								<MdOutlineDragIndicator color="rgba(0, 0, 0, 0.5)" />
							</div>
						)}

						{renderEverything && (
							<>
								{!groupLocked ? (
									<>
										<PartEditControls
											rundownId={rundownId}
											parentGroupId={parentGroupId}
											part={part}
											allActionsForPart={allActionsForPart}
											renderEverything={renderEverything}
											groupLocked={groupLocked}
											groupOrPartLocked={groupOrPartLocked}
										/>
										{!groupLocked && (
											<div className="button-extend">
												<ToggleBtn
													title={extended ? 'Click to restore Part.' : 'Click to edit Part.'}
													selected={extended}
													size="small"
													onChange={() => setExtended(!extended)}
												>
													<MdMoreHoriz />
												</ToggleBtn>
											</div>
										)}
										{extended && (
											<>
												<PartControlButtons
													rundownId={rundownId}
													groupId={parentGroupId}
													partId={part.id}
													disabled={part.disabled}
													groupPlayoutMode={groupPlayoutMode}
												/>
												<div className="part-button__header__end">
													<TrashBtn
														disabled={groupOrPartLocked}
														title={
															'Delete Part' +
															(groupOrPartLocked
																? ' (disabled due to locked Part or Group)'
																: '')
														}
														onClick={() => {
															const pressedKeys = sorensen.getPressedKeys()
															if (
																pressedKeys.includes('ControlLeft') ||
																pressedKeys.includes('ControlRight')
															) {
																// Delete immediately with no confirmation dialog.
																handleDelete()
															} else {
																setDeleteConfirmationOpen(true)
															}
														}}
													/>
													<DuplicateBtn
														title="Duplicate Part"
														disabled={groupLocked}
														onClick={handleDuplicateBtn}
													/>
												</div>
											</>
										)}
									</>
								) : (
									<>
										<div className="part-button__header__label">{partLabel}</div>
									</>
								)}
							</>
						)}
					</div>
				</div>
				{!extended && (
					<div className="part-button__cover">
						<div className="part-button__cover__control-buttons">
							<PartControlButtons
								rundownId={rundownId}
								groupId={parentGroupId}
								partId={part.id}
								disabled={part.disabled}
								groupPlayoutMode={groupPlayoutMode}
							/>
						</div>
						<div className="part-button__cover__label">
							<span>{partLabel}</span>
						</div>
					</div>
				)}
				<div className="part-button__content">
					<PartTimeline
						{...{
							renderEverything,
							rundownId,
							parentGroupId,
							mappings,
							part,
							resolverErrorMessage,
							orgMaxDuration,

							timelineObjMove,
							timelineLayerObjects,
							layersDivRef,
							maxDurationAdjusted,
							msPerPixel,
							groupOrPartLocked,
						}}
						emptyLayer={extended}
					/>
				</div>
				<div className="part__selected" />
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
						Are you sure you want to delete the part {part.name}?
						<br />
						<br />
						(Tip: Hold CTRL when clicking the button to skip this dialog)`
					</div>
				</ConfirmationDialog>
			</div>
		</VisibilitySensor>
	)
})
