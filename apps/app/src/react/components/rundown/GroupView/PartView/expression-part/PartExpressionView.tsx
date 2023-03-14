import React, { useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { store } from '../../../../../mobx/store'
import { PlayoutMode } from '../../../../../../models/rundown/Group'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { MdLockOpen, MdLock, MdRepeatOne } from 'react-icons/md'
import { Mappings } from 'timeline-state-resolver-types'
import { EmptyLayer } from '../../EmptyLayer'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { IoMdEye } from 'react-icons/io'
import { RiEyeCloseLine } from 'react-icons/ri'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import { PlayBtn } from '../../../../inputs/PlayBtn/PlayBtn'
import { PauseBtn } from '../../../../inputs/PauseBtn/PauseBtn'
import { PlayButtonData, StopBtn } from '../../../../inputs/StopBtn/StopBtn'
import { useMemoComputedObject } from '../../../../../mobx/lib'
import { TriggerBtn } from '../../../../inputs/TriggerBtn/TriggerBtn'
import { ToggleBtn } from '../../../../inputs/ToggleBtn/ToggleBtn'
import { sortLayers, timelineObjsOntoSeparateLayers } from '../../../../../../lib/partTimeline'
import { convertSorensenToElectron } from '../../../../../../lib/triggers/identifiers'
import { EditPartName } from '../lib/EditPartName'
import { getPartMethods } from '../lib/lib'
import { PartViewWrap } from '../PartViewWrap'
import { Popover } from '@mui/material'
import { RundownTriggersSubmenu } from '../../part/TriggersSubmenu/TriggersSubmenu'
import { LayerEmptyForExpression, LayerForExpression } from './LayerForExpression'
import { LayerName, LayerNameEmpty } from '../../part/LayerName/LayerName'

export const PartExpressionView: React.FC<{
	rundownId: string
	parentGroupId: string
	partId: string
	mappings: Mappings
}> = observer(function PartExpressionView({ rundownId, parentGroupId, partId, mappings }) {
	const part = store.rundownsStore.getPart(partId)
	const ipcServer = useContext(IPCServerContext)

	// const hotkeyContext = useContext(HotkeyContext)
	const { handleError } = useContext(ErrorHandlerContext)
	// const log = useContext(LoggerContext)
	// const layersDivRef = useRef<HTMLDivElement>(null)
	// const changedObjects = useRef<{
	// 	[objectId: string]: TimelineObj
	// } | null>(null)
	// const duplicatedObjects = useRef<{
	// 	[objectId: string]: TimelineObj
	// } | null>(null)
	// const objectsToMoveToNewLayer = useRef<string[] | null>(null)
	// const [trackWidth, setTrackWidth] = useState(0)
	// const [bypassSnapping, setBypassSnapping] = useState(false)
	const [waitingForBackendUpdate, setWaitingForBackendUpdate] = useState(false)

	const { orgResolvedTimeline, resolverErrorMessage, onVisibilityChange, renderEverything } = getPartMethods({
		rundownId,
		parentGroupId,
		partId,
		partDuration: part.duration,
	})

	// const timelineObjMove = useMemoComputedObject<TimelineObjectMove>(
	// 	() => {
	// 		const objMove = store.guiStore.timelineObjMove

	// 		if (objMove.partId === part.id) {
	// 			return objMove
	// 		} else {
	// 			return {
	// 				moveType: null,
	// 				wasMoved: null,
	// 				partId: null,
	// 				moveId: null,
	// 				hoveredLayerId: null,
	// 			}
	// 		}
	// 	},
	// 	[part.id],
	// 	true
	// )

	// const maxDurationAdjusted = orgMaxDuration || DEFAULT_DURATION

	// const msPerPixel = maxDurationAdjusted / trackWidth
	// const snapDistanceInMilliseconds = msPerPixel * SNAP_DISTANCE_IN_PIXELS

	// const snapPoints = useMemo(() => {
	// 	const snapPoints: Array<SnapPoint> = []

	// 	for (const timelineObj of Object.values(orgResolvedTimeline.objects)) {
	// 		if (Array.isArray(timelineObj.enable)) {
	// 			return
	// 		}
	// 		const instance = timelineObj.resolved.instances[0] as TimelineObjectInstance | undefined
	// 		if (!instance) continue

	// 		const referring: string = [...instance.references, ...timelineObj.resolved.directReferences].join(',')

	// 		snapPoints.push({
	// 			timelineObjId: timelineObj.id,
	// 			time: instance.start,
	// 			expression: `#${timelineObj.id}.start`,
	// 			referring,
	// 		})
	// 		if (instance.end) {
	// 			snapPoints.push({
	// 				timelineObjId: timelineObj.id,
	// 				time: instance.end,
	// 				expression: `#${timelineObj.id}.end`,
	// 				referring,
	// 			})
	// 		}
	// 	}
	// 	snapPoints.sort(sortSnapPoints)

	// 	return snapPoints
	// }, [orgResolvedTimeline])

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
	// useLayoutEffect(() => {
	// 	if (layersDivRef.current) {
	// 		const size = layersDivRef.current.getBoundingClientRect()
	// 		setTrackWidth(size.width)
	// 	}
	// }, [])

	// Update trackWidth at the end of a move.
	// @TODO: Update trackWidth _during_ a move?
	// useLayoutEffect(() => {
	// 	if (timelineObjMove.moveType && timelineObjMove.partId === part.id && layersDivRef.current) {
	// 		const size = layersDivRef.current.getBoundingClientRect()
	// 		setTrackWidth(size.width)
	// 	}
	// }, [timelineObjMove.moveType, timelineObjMove.partId, part.id])
	const resolvedTimeline = orgResolvedTimeline
	const partTimeline = useMemoComputedObject(() => {
		return store.rundownsStore.getPartTimeline(partId)
	}, [partId])
	// const { modifiedTimeline, resolvedTimeline, newChangedObjects, newDuplicatedObjects, newObjectsToMoveToNewLayer } =
	// 	useMemoComputedObject(() => {
	// 		let modifiedTimeline: TimelineObj[]
	// 		let resolvedTimeline: ResolvedTimeline
	// 		let newChangedObjects: { [objectId: string]: TimelineObj } | null = null
	// 		let newDuplicatedObjects: { [objectId: string]: TimelineObj } | null = null
	// 		let newObjectsToMoveToNewLayer: string[] | null = null

	// 		const partTimeline = store.rundownsStore.getPartTimeline(partId)

	// 		const dragDelta = timelineObjMove.dragDelta || 0
	// 		const leaderObj = partTimeline.find((obj) => obj.obj.id === timelineObjMove.leaderTimelineObjId)
	// 		const leaderObjOriginalLayerId = leaderObj?.obj.layer
	// 		const leaderObjLayerChanged = leaderObjOriginalLayerId !== timelineObjMove.hoveredLayerId
	// 		if (
	// 			leaderObj &&
	// 			timelineObjMove.moveType === 'whole' &&
	// 			timelineObjMove.hoveredLayerId &&
	// 			timelineObjMove.hoveredLayerId.startsWith(EMPTY_LAYER_ID_PREFIX) &&
	// 			store.guiStore.selected.length === 1
	// 		) {
	// 			// Handle moving a timelineObj to the "new layer" area
	// 			// This type of move is only allowed when a single timelineObj is selected.

	// 			modifiedTimeline = store.rundownsStore.getPartTimeline(partId)
	// 			resolvedTimeline = orgResolvedTimeline
	// 			newObjectsToMoveToNewLayer = [leaderObj.obj.id]
	// 		} else if (
	// 			(dragDelta || leaderObjLayerChanged) &&
	// 			timelineObjMove.partId === part.id &&
	// 			leaderObj &&
	// 			timelineObjMove.leaderTimelineObjId &&
	// 			timelineObjMove.moveId !== null &&
	// 			!HANDLED_MOVE_IDS.includes(timelineObjMove.moveId)
	// 		) {
	// 			// Handle movement, snapping

	// 			// Check the the layer movement is legal:
	// 			let moveToLayerId = timelineObjMove.hoveredLayerId
	// 			if (moveToLayerId && !moveToLayerId.startsWith(EMPTY_LAYER_ID_PREFIX)) {
	// 				const newLayerMapping = mappings[moveToLayerId]
	// 				// @TODO: Figure out how newLayerMapping can be undefined here.
	// 				if (!newLayerMapping || !filterMapping(newLayerMapping, leaderObj?.obj)) {
	// 					moveToLayerId = null
	// 				}
	// 			}

	// 			const selectedTimelineObjIds = compact(
	// 				store.guiStore.selected.map((s) => (s.type === 'timelineObj' ? s.timelineObjId : undefined))
	// 			)
	// 			try {
	// 				const o = applyMovementToTimeline({
	// 					orgTimeline: partTimeline,
	// 					orgResolvedTimeline: orgResolvedTimeline,
	// 					snapPoints: bypassSnapping ? [] : snapPoints || [],
	// 					snapDistanceInMilliseconds: snapDistanceInMilliseconds,
	// 					dragDelta: dragDelta,

	// 					// The use of wasMoved here helps prevent a brief flash at the
	// 					// end of a move where the moved timelineObjs briefly appear at their pre-move position.
	// 					moveType: timelineObjMove.moveType ?? timelineObjMove.wasMoved,
	// 					leaderTimelineObjId: timelineObjMove.leaderTimelineObjId,
	// 					selectedTimelineObjIds: selectedTimelineObjIds,
	// 					cache: cache.current,
	// 					leaderTimelineObjNewLayer: moveToLayerId,
	// 					duplicate: Boolean(timelineObjMove.duplicate),
	// 				})
	// 				modifiedTimeline = o.modifiedTimeline
	// 				resolvedTimeline = o.resolvedTimeline
	// 				newChangedObjects = o.changedObjects
	// 				newDuplicatedObjects = o.duplicatedObjects

	// 				if (
	// 					typeof leaderObjOriginalLayerId === 'string' &&
	// 					!resolvedTimeline.layers[leaderObjOriginalLayerId]
	// 				) {
	// 					// If the leaderObj's original layer is now empty, it won't be rendered,
	// 					// making it impossible for the user to move the leaderObj back to whence it came.
	// 					// So, we add an empty layer object here to force it to remain visible.
	// 					resolvedTimeline.layers[leaderObjOriginalLayerId] = []
	// 				}
	// 			} catch (e) {
	// 				// If there was an error applying the movement (for example a circular dependency),
	// 				// reset the movement to the original state:

	// 				handleError('There was an error when trying to move: ' + stringifyError(e))

	// 				modifiedTimeline = partTimeline
	// 				resolvedTimeline = orgResolvedTimeline
	// 				newChangedObjects = null
	// 				newDuplicatedObjects = null
	// 				newObjectsToMoveToNewLayer = null
	// 			}
	// 		} else {
	// 			modifiedTimeline = partTimeline
	// 			resolvedTimeline = orgResolvedTimeline
	// 		}

	// 		const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline, false)

	// 		return {
	// 			maxDuration,
	// 			modifiedTimeline,
	// 			resolvedTimeline,
	// 			newChangedObjects,
	// 			newDuplicatedObjects,
	// 			newObjectsToMoveToNewLayer,
	// 		}
	// 	}, [
	// 		timelineObjMove,
	// 		part.id,
	// 		mappings,
	// 		handleError,
	// 		orgResolvedTimeline,
	// 		bypassSnapping,
	// 		snapPoints,
	// 		snapDistanceInMilliseconds,
	// 		log,
	// 	])

	// useEffect(() => {
	// 	if (newObjectsToMoveToNewLayer && !_.isEmpty(newObjectsToMoveToNewLayer)) {
	// 		changedObjects.current = null
	// 	} else if (newChangedObjects && !_.isEmpty(newChangedObjects)) {
	// 		changedObjects.current = newChangedObjects

	// 		if (newDuplicatedObjects && !_.isEmpty(newDuplicatedObjects)) {
	// 			duplicatedObjects.current = newDuplicatedObjects
	// 		} else {
	// 			duplicatedObjects.current = null
	// 		}
	// 	}
	// }, [newChangedObjects, newObjectsToMoveToNewLayer, newDuplicatedObjects])

	// useEffect(() => {
	// 	// Handle when we stop moving:

	// 	if (
	// 		timelineObjMove.partId === part.id &&
	// 		timelineObjMove.moveType === null &&
	// 		timelineObjMove.wasMoved !== null &&
	// 		timelineObjMove.moveId !== null &&
	// 		!waitingForBackendUpdate &&
	// 		!HANDLED_MOVE_IDS.includes(timelineObjMove.moveId)
	// 	) {
	// 		HANDLED_MOVE_IDS.unshift(timelineObjMove.moveId)
	// 		setWaitingForBackendUpdate(true)
	// 		store.guiStore.updateTimelineObjMove({
	// 			saving: true,
	// 		})

	// 		// Prevent the list of handled move IDs from growing infinitely:
	// 		if (HANDLED_MOVE_IDS.length > MAX_HANDLED_MOVE_IDS) {
	// 			HANDLED_MOVE_IDS.length = MAX_HANDLED_MOVE_IDS
	// 		}

	// 		const promises: Promise<unknown>[] = []

	// 		if (changedObjects.current) {
	// 			for (const obj of Object.values(changedObjects.current)) {
	// 				const promise = ipcServer.updateTimelineObj({
	// 					rundownId: rundownId,
	// 					partId: part.id,
	// 					groupId: parentGroupId,
	// 					timelineObjId: obj.obj.id,
	// 					timelineObj: obj,
	// 				})
	// 				promises.push(promise)
	// 			}
	// 			changedObjects.current = null
	// 		}
	// 		if (duplicatedObjects.current) {
	// 			promises.push(
	// 				ipcServer.insertTimelineObjs({
	// 					rundownId: rundownId,
	// 					partId: part.id,
	// 					groupId: parentGroupId,
	// 					timelineObjs: Object.values(duplicatedObjects.current),
	// 					target: null,
	// 				})
	// 			)
	// 			duplicatedObjects.current = null
	// 		}

	// 		if (objectsToMoveToNewLayer.current) {
	// 			for (const objId of objectsToMoveToNewLayer.current) {
	// 				const promise = ipcServer.moveTimelineObjToNewLayer({
	// 					rundownId: rundownId,
	// 					partId: part.id,
	// 					groupId: parentGroupId,
	// 					timelineObjId: objId,
	// 				})
	// 				promises.push(promise)
	// 			}
	// 			objectsToMoveToNewLayer.current = null
	// 		}
	// 		Promise.allSettled(promises)
	// 			.then((_results) => {
	// 				setWaitingForBackendUpdate(false)
	// 			})
	// 			.catch((error) => {
	// 				handleError(error)
	// 				setWaitingForBackendUpdate(false)
	// 			})
	// 	}
	// }, [
	// 	//
	// 	part.id,
	// 	snapDistanceInMilliseconds,
	// 	ipcServer,
	// 	rundownId,
	// 	parentGroupId,
	// 	waitingForBackendUpdate,
	// 	handleError,
	// 	timelineObjMove.partId,
	// 	timelineObjMove.moveType,
	// 	timelineObjMove.wasMoved,
	// 	timelineObjMove.moveId,
	// ])
	// useEffect(() => {
	// 	objectsToMoveToNewLayer.current = newObjectsToMoveToNewLayer
	// }, [newObjectsToMoveToNewLayer])

	// useEffect(() => {
	// 	const onKey = () => {
	// 		const pressed = sorensen.getPressedKeys()
	// 		setBypassSnapping(pressed.includes('ShiftLeft') || pressed.includes('ShiftRight'))
	// 	}
	// 	onKey()

	// 	sorensen.bind('Shift', onKey, {
	// 		up: false,
	// 		global: true,
	// 	})
	// 	sorensen.bind('Shift', onKey, {
	// 		up: true,
	// 		global: true,
	// 	})

	// 	sorensen.addEventListener('keycancel', onKey)

	// 	return () => {
	// 		sorensen.unbind('Shift', onKey)
	// 		sorensen.removeEventListener('keycancel', onKey)
	// 	}
	// }, [hotkeyContext])

	// Disable button:
	const toggleDisable = useCallback(() => {
		ipcServer
			.updatePart({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				part: {
					disabled: !part.disabled,
				},
			})
			.catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.disabled, part.id, rundownId])

	// Lock button:
	const toggleLock = useCallback(() => {
		ipcServer
			.updatePart({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				part: {
					locked: !part.locked,
				},
			})
			.catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, part.locked, rundownId])

	// Loop button:
	const toggleLoop = useCallback(() => {
		ipcServer
			.updatePart({
				rundownId,
				groupId: parentGroupId,
				partId: part.id,
				part: {
					loop: !part.loop,
				},
			})
			.catch(handleError)
	}, [handleError, ipcServer, parentGroupId, part.id, part.loop, rundownId])

	// Trigger button:
	const handleTriggerBtn = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		setTriggersSubmenuPopoverAnchorEl(event.currentTarget)
	}, [])

	// Triggers Submenu
	const [triggersSubmenuPopoverAnchorEl, setTriggersSubmenuPopoverAnchorEl] =
		React.useState<HTMLButtonElement | null>(null)
	const closeTriggersSubmenu = useCallback(() => {
		setTriggersSubmenuPopoverAnchorEl(null)
	}, [])
	const triggersSubmenuOpen = Boolean(triggersSubmenuPopoverAnchorEl)

	const groupLocked =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.locked).get() || false

	const groupPlayoutMode =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.playoutMode).get() ||
		PlayoutMode.NORMAL

	const groupOrPartLocked = groupLocked || part.locked || false
	const sortedLayers = useMemo(() => {
		return sortLayers(resolvedTimeline.layers, mappings)
	}, [mappings, resolvedTimeline.layers])
	const firstTimelineObj = partTimeline.find((obj) => obj.obj.id === sortedLayers[0]?.objectIds[0])
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

	const layersWithObjects = timelineObjsOntoSeparateLayers(sortedLayers, resolvedTimeline, partTimeline)

	const failedGlobalShortcuts = useMemoComputedObject(() => {
		return store.triggersStore.failedGlobalTriggers
	}, [store.triggersStore.failedGlobalTriggers])
	const anyGlobalTriggerFailed = useMemo(() => {
		return allActionsForPart.some((action) =>
			failedGlobalShortcuts.has(
				action.trigger.fullIdentifiers.map(convertSorensenToElectron).filter(Boolean).join('+')
			)
		)
	}, [allActionsForPart, failedGlobalShortcuts])

	return (
		<PartViewWrap
			rundownId={rundownId}
			parentGroupId={parentGroupId}
			partId={partId}
			tabAdditionalClassNames={tabAdditionalClassNames}
			onVisibilityChange={onVisibilityChange}
			renderEverything={renderEverything}
			partClassNames={['part-expression']}
		>
			<>
				<div className="part__meta">
					<div className="part__meta__left">
						<EditPartName
							partId={part.id}
							partName={part.name}
							groupOrPartLocked={groupOrPartLocked}
							rundownId={rundownId}
							parentGroupId={parentGroupId}
						/>

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
											locked={groupOrPartLocked}
											triggerCount={allActionsForPart.length}
											anyGlobalTriggerFailed={anyGlobalTriggerFailed}
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
				{/* {!groupLocked && <div className="part__dropdown"></div>} */}

				{/* <div className="part__time">
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
								<span className="part__time__duration__value">
									{formatDuration(part.resolved.duration, DISPLAY_DECIMAL_COUNT)}
								</span>
							</div>
						</>
					)}
				</div> */}

				<div className="part__layer-names">
					{layersWithObjects.map(({ layerId }) => {
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
				<div className="part__expression__timeline">
					{/* <div className="countdown-wrapper">
						<CountdownHeads groupId={parentGroupId} partId={part.id} />
					</div> */}
					{/* <div className="layers-wrapper"> */}
					{renderEverything && (
						<>
							{resolverErrorMessage && <div className="part__error-overlay">{resolverErrorMessage}</div>}
							{/* <PlayHead partId={part.id} groupId={parentGroupId} partViewDuration={orgMaxDuration} /> */}
						</>
					)}

					{layersWithObjects.map(({ layerId, resolved, timelineObj }) => {
						if (renderEverything) {
							return (
								<LayerForExpression
									key={timelineObj.obj.id}
									rundownId={rundownId}
									groupId={parentGroupId}
									partId={part.id}
									resolved={resolved}
									timelineObj={timelineObj}
									layerId={layerId}
									locked={groupOrPartLocked}
									mapping={mappings[layerId]}
								/>
							)
						} else {
							return <LayerEmptyForExpression key={timelineObj.obj.id} />
						}
					})}

					{!groupOrPartLocked && (
						<EmptyLayer rundownId={rundownId} groupId={parentGroupId} partId={part.id} />
					)}

					{/* </div> */}
				</div>
				{renderEverything && (
					<Popover
						open={triggersSubmenuOpen}
						anchorEl={triggersSubmenuPopoverAnchorEl}
						onClose={closeTriggersSubmenu}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'left',
						}}
					>
						<RundownTriggersSubmenu
							rundownId={rundownId}
							groupId={parentGroupId}
							part={part}
							locked={groupOrPartLocked}
							allActionsForPart={allActionsForPart}
						/>
					</Popover>
				)}
			</>
		</PartViewWrap>
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
