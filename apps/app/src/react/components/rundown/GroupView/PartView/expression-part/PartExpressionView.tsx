import React, { useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react'
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
import { getPartLayers, sortLayers, timelineObjsOntoSeparateLayers } from '../../../../../../lib/partTimeline'
import { convertSorensenToElectron } from '../../../../../../lib/triggers/identifiers'
import { EditPartName } from '../lib/EditPartName'
import { getPartMethods } from '../lib/lib'
import { PartViewWrap } from '../PartViewWrap'
import { Popover } from '@mui/material'
import { RundownTriggersSubmenu } from '../../part/TriggersSubmenu/TriggersSubmenu'
import { LayerEmptyForExpression, LayerForExpression } from './LayerForExpression'
import { LayerName, LayerNameEmpty } from '../../part/LayerName/LayerName'
import { DISPLAY_EXPRESSION_MAX_DURATION } from '../../../../../constants'

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

	const setTimeoutTimer = useRef<NodeJS.Timeout | null>(null)
	if (setTimeoutTimer.current) {
		clearTimeout(setTimeoutTimer.current)
		setTimeoutTimer.current = null
	}

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
	// const resolvedTimeline = orgResolvedTimeline
	const partTimeline = useMemoComputedObject(() => {
		return store.rundownsStore.getPartTimeline(partId)
	}, [partId])

	const estimatedDuration = DISPLAY_EXPRESSION_MAX_DURATION

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
		const layers = getPartLayers(partTimeline)
		return sortLayers(layers, mappings)
	}, [mappings, partTimeline])

	const layersWithObjectId: {
		layerId: string
		timelineObjId: string
	}[] = []
	for (const layer of sortedLayers) {
		for (const objId of layer.objectIds) {
			layersWithObjectId.push({ layerId: layer.layerId, timelineObjId: objId })
		}
	}

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

	// const layersWithObjects = timelineObjsOntoSeparateLayers(sortedLayers, resolvedTimeline, partTimeline)

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

				<div className="part__layer-names">
					{layersWithObjectId.map(({ layerId }) => {
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
					{renderEverything && (
						<>
							{resolverErrorMessage && <div className="part__error-overlay">{resolverErrorMessage}</div>}
							{/* <PlayHead partId={part.id} groupId={parentGroupId} partViewDuration={orgMaxDuration} /> */}
						</>
					)}

					<>
						{layersWithObjectId.map(({ layerId, timelineObjId }) => {
							if (renderEverything) {
								return (
									<LayerForExpression
										key={timelineObjId}
										rundownId={rundownId}
										groupId={parentGroupId}
										partId={part.id}
										timelineObjId={timelineObjId}
										layerId={layerId}
										locked={groupOrPartLocked}
										mapping={mappings[layerId]}
										partDuration={estimatedDuration}
									/>
								)
							} else {
								return <LayerEmptyForExpression key={timelineObjId} />
							}
						})}
					</>

					{!groupOrPartLocked && (
						<EmptyLayer rundownId={rundownId} groupId={parentGroupId} partId={part.id} />
					)}
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
