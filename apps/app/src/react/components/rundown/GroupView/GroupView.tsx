import React, { useEffect, useRef, useState, useContext, useCallback } from 'react'
import sorensen from '@sofie-automation/sorensen'
import { TrashBtn } from '../../inputs/TrashBtn'
import { GroupGUI } from '../../../../models/rundown/Group'
import { PartView } from './PartView'
import { GroupPreparedPlayData } from '../../../../models/GUI/PreparedPlayhead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import {
	DragItemTypes,
	GroupDragItem,
	isGroupDragItem,
	isPartDragItem,
	isResourceDragItem,
} from '../../../api/DragItemTypes'
import { useDrag, useDrop, XYCoord } from 'react-dnd'
import { Mappings } from 'timeline-state-resolver-types'
import { Button, Popover, TextField, ToggleButton } from '@mui/material'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { assertNever } from '@shared/lib'
import { allowMovingItemIntoGroup, getNextPartIndex, getPrevPartIndex } from '../../../../lib/util'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'

import { DropZone } from '../../util/DropZone'
import {
	MdChevronRight,
	MdLock,
	MdLockOpen,
	MdLooksOne,
	MdPlaylistPlay,
	MdRepeat,
	MdOutlineDragIndicator,
} from 'react-icons/md'
import { IoMdEye } from 'react-icons/io'
import { RiEyeCloseLine } from 'react-icons/ri'
import { AiFillStepForward } from 'react-icons/ai'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { computed } from 'mobx'
import { PlayBtn } from '../../inputs/PlayBtn/PlayBtn'
import { PauseBtn } from '../../inputs/PauseBtn/PauseBtn'
import { PlayButtonData, StopBtn } from '../../inputs/StopBtn/StopBtn'
import { DuplicateBtn } from '../../inputs/DuplicateBtn'
import { useMemoComputedObject, useMemoComputedValue } from '../../../mobx/lib'
import { BsKeyboard, BsKeyboardFill, BsLightning, BsLightningFill } from 'react-icons/bs'
import { GroupButtonAreaPopover } from './GroupButtonAreaPopover'
import { GroupAutoFillPopover } from './GroupAutoFillPopover'
import VisibilitySensor from 'react-visibility-sensor'
import { Btn } from '../../inputs/Btn/Btn'

const DEFAULT_PART_HEIGHT = 80

export const GroupView: React.FC<{
	rundownId: string
	groupId: string
	groupIndex: number
	mappings: Mappings
}> = observer(function GroupView({ groupId, groupIndex, rundownId, mappings }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const group = store.rundownsStore.getGroup(groupId)
	const allAssignedAreas = store.projectStore.assignedAreas
	const allAvailableAreas = store.projectStore.availableAreas

	const [editingGroupName, setEditingGroupName] = useState(false)
	const [editedName, setEditedName] = useState(group.name)

	useEffect(() => {
		setEditedName(group.name)
	}, [group.name])
	const submitNameEdit = useCallback(() => {
		ipcServer
			.updateGroup({
				rundownId,
				groupId,
				group: {
					name: editedName,
				},
			})
			.catch(handleError)
		setEditingGroupName(false)
	}, [handleError, ipcServer, rundownId, groupId, editedName])

	const playheadData = useRef<GroupPreparedPlayData | null>(null)
	const [_activeParts, setActiveParts] = useState<{ [partId: string]: true }>({})
	useEffect(() => {
		playheadData.current = group.preparedPlayData

		// console

		const activeParts0: { [partId: string]: true } = {}

		if (group.preparedPlayData) {
			if (group.preparedPlayData.type === 'single') {
				for (const part of group.preparedPlayData.parts) {
					activeParts0[part.part.id] = true
				}
				if (group.preparedPlayData.repeating) {
					for (const part of group.preparedPlayData.repeating.parts) {
						activeParts0[part.part.id] = true
					}
				}
			} else if (group.preparedPlayData.type === 'multi') {
				for (const part of Object.values(group.preparedPlayData.parts)) {
					activeParts0[part.part.id] = true
				}
			} else {
				assertNever(group.preparedPlayData)
			}
		}
		setActiveParts(activeParts0)
	}, [group])

	const guiSettings = computed(() => store.guiStore.getGroupSettings(groupId))

	const groupCollapsed = guiSettings.get().collapsed

	const groupIsPlaying = computed(() => store.groupPlayDataStore.groups.get(group.id)?.groupIsPlaying || false).get()
	const anyPartIsPlaying = computed(
		() => store.groupPlayDataStore.groups.get(group.id)?.anyPartIsPlaying || false
	).get()

	/** Whether we're allowed to stop playing */
	const wasPlayingRef = useRef(false)
	const stopPlayingRef = useRef(true)
	useEffect(() => {
		if (!groupIsPlaying) {
			return
		}

		if (group.preparedPlayData && wasPlayingRef.current && !group.oneAtATime && !groupIsPlaying) {
			// We believe that we are are playing, but the playhead says otherwise.
			// That probably means that we have reached the end.

			if (stopPlayingRef.current) {
				// Stop the group, so that the "stop"-buttons reflect the correct state:
				ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(handleError)
				stopPlayingRef.current = false
			}
		} else {
			stopPlayingRef.current = true
		}

		// We are definitely playing
		if (group.preparedPlayData && groupIsPlaying) {
			wasPlayingRef.current = true
		} else {
			wasPlayingRef.current = false
		}
	}, [groupIsPlaying, group, ipcServer, rundownId, handleError])

	const wrapperRef = useRef<HTMLDivElement>(null)

	// Drag n' Drop re-ordering
	const dragRef = useRef<HTMLDivElement>(null)
	const [{ isDragging }, drag, preview] = useDrag(
		{
			type: DragItemTypes.GROUP_ITEM,
			item: (): GroupDragItem => {
				return {
					type: DragItemTypes.GROUP_ITEM,
					groupId: group.id,
					position: groupIndex,
				}
			},
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			isDragging: (monitor) => {
				return group.id === monitor.getItem().groupId
			},
			end: () => {
				store.rundownsStore.commitMoveGroupInCurrentRundown()?.catch(handleError)
			},
		},
		[group.id, groupIndex, store.guiStore]
	)
	const [{ handlerId }, drop] = useDrop(
		{
			accept: [DragItemTypes.PART_ITEM, DragItemTypes.GROUP_ITEM],
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			canDrop: (movedItem) => {
				if (!isPartDragItem(movedItem)) {
					return false
				}

				return !!allowMovingItemIntoGroup(movedItem.partId, movedItem.fromGroup, group)
			},
			hover(movedItem, monitor) {
				if (isGroupDragItem(movedItem)) {
					// Is dragging a Group
					if (!wrapperRef.current) {
						return
					}

					// Don't replace items with themselves
					if (movedItem.groupId === group.id) {
						return
					}

					const dragIndex = movedItem.position
					const hoverIndex = groupIndex

					if (dragIndex === null) {
						return
					}

					// Determine rectangle on screen
					const hoverBoundingRect = wrapperRef.current.getBoundingClientRect()

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

					store.rundownsStore.moveGroupInCurrentRundown(movedItem.groupId, hoverIndex)
					movedItem.position = hoverIndex
				} else if (isPartDragItem(movedItem)) {
					// Is dragging a Part
					if (!monitor.isOver({ shallow: true })) {
						return
					}

					if (!wrapperRef.current) {
						return
					}

					const dragIndex = movedItem.position
					const hoverIndex = groupIndex

					// Determine rectangle on screen
					const hoverBoundingRect = wrapperRef.current.getBoundingClientRect()

					// Get vertical middle
					const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

					// Determine mouse position
					const clientOffset = monitor.getClientOffset()

					// Get pixels to the top
					const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

					/**
					 * Defines a band of pixels around the vertical middle of the Group,
					 * used to determine how to handle this hover event depending on if
					 * the user's cursor is within this band or not.
					 */
					const midBand = hoverBoundingRect.height / 3 / 2

					/**
					 * An array of this Group's Parts, minus the Part currently being dragged.
					 */
					const groupPartsWithoutMovedPart = group.partIds.filter((partId) => partId !== movedItem.partId)

					if (groupPartsWithoutMovedPart.length <= 0) {
						// If the group is empty, and if the user's cursor is hovering within midBand
						// pixels of the group's vertical center, then we assume that the user wants to move
						// the Part into the hovered Group.

						if (Math.abs(hoverClientY - hoverMiddleY) > midBand) {
							return
						}

						if (!allowMovingItemIntoGroup(movedItem.partId, movedItem.fromGroup, group)) {
							return
						}

						const hoverIndex = 0
						const hoverGroup = group
						const hoverGroupIndex = groupIndex

						// Don't allow dragging into transparent groups, which can only have one part.
						if (hoverGroup.transparent) {
							return
						}

						// Don't replace items with themselves
						if (movedItem.fromGroup.id === hoverGroup.id && movedItem.position === hoverIndex) {
							return
						}

						// Time to actually perform the action
						store.rundownsStore.movePartInCurrentRundown(movedItem.partId, hoverGroup.id, hoverIndex)

						// Note: we're mutating the monitor item here!
						// Generally it's better to avoid mutations,
						// but it's good here for the sake of performance
						// to avoid expensive index searches.
						movedItem.toGroupId = hoverGroup.id
						movedItem.toGroupIndex = hoverGroupIndex
						movedItem.toGroupTransparent = false
						movedItem.position = hoverIndex
					} else {
						// Else, we assume that the user wants to move the Part as a Transparent Group
						// and therefore move it either above or below the currently hovered Group.

						if (dragIndex === hoverIndex - 1 && hoverClientY < hoverMiddleY) {
							return
						}

						if (dragIndex === hoverIndex + 1 && hoverClientY > hoverMiddleY) {
							return
						}

						if (hoverClientY < hoverMiddleY) {
							store.rundownsStore.movePartInCurrentRundown(movedItem.partId, null, hoverIndex)
							movedItem.position = hoverIndex
						} else {
							store.rundownsStore.movePartInCurrentRundown(movedItem.partId, null, hoverIndex + 1)
							movedItem.position = hoverIndex + 1
						}

						movedItem.toGroupId = null
					}
				}
			},
		},
		[group, groupIndex]
	)

	useEffect(() => {
		drag(dragRef)
	}, [drag])

	useEffect(() => {
		drop(preview(wrapperRef))
	}, [drop, preview])

	// Delete button:
	const handleDelete = useCallback(() => {
		ipcServer.deleteGroup({ rundownId, groupId: group.id }).catch(handleError)
	}, [group.id, handleError, ipcServer, rundownId])
	const handleDeleteClick = useCallback(() => {
		const pressedKeys = sorensen.getPressedKeys()
		if (pressedKeys.includes('ControlLeft') || pressedKeys.includes('ControlRight')) {
			// Delete immediately with no confirmation dialog.
			handleDelete()
		} else {
			setDeleteConfirmationOpen(true)
		}
	}, [handleDelete])

	// Duplicate button:
	const handleDuplicate = useCallback(() => {
		ipcServer.duplicateGroup({ rundownId, groupId: group.id }).catch(handleError)
	}, [group.id, handleError, ipcServer, rundownId])

	// Step down button:
	const { nextPartExists, prevPartExists } = useMemoComputedObject(() => {
		const groupWithParts = store.rundownsStore.getGroupWithParts(groupId)

		const nextPartIndex = getNextPartIndex(groupWithParts)
		const prevPartIndex = getPrevPartIndex(groupWithParts)

		return {
			nextPartExists: nextPartIndex in groupWithParts.parts,
			prevPartExists: prevPartIndex in groupWithParts.parts,
		}
	}, [groupId])

	const canStepDown = !group.disabled && anyPartIsPlaying && nextPartExists
	const handleStepDown = useCallback(() => {
		ipcServer.playNext({ rundownId, groupId: group.id }).catch(handleError)
	}, [group.id, handleError, ipcServer, rundownId])

	// Step down up:

	const canStepUp = !group.disabled && anyPartIsPlaying && prevPartExists
	const handleStepUp = useCallback(() => {
		ipcServer.playPrev({ rundownId, groupId: group.id }).catch(handleError)
	}, [group.id, handleError, ipcServer, rundownId])

	// Collapse button:
	const handleCollapse = useCallback(() => {
		const settings = store.guiStore.getGroupSettings(groupId)
		store.guiStore.setGroupSettings(groupId, {
			collapsed: !settings.collapsed,
		})
	}, [groupId])

	// Disable button:
	const toggleDisable = useCallback(() => {
		ipcServer
			.toggleGroupDisable({
				rundownId,
				groupId: group.id,
				value: !group.disabled,
			})
			.catch(handleError)
	}, [group.disabled, group.id, handleError, ipcServer, rundownId])

	// Lock button:
	const toggleLock = useCallback(() => {
		ipcServer
			.toggleGroupLock({
				rundownId,
				groupId: group.id,
				value: !group.locked,
			})
			.catch(handleError)
	}, [group.id, group.locked, handleError, ipcServer, rundownId])

	// One-at-a-time button:
	const toggleOneAtATime = useCallback(() => {
		ipcServer
			.toggleGroupOneAtATime({
				rundownId,
				groupId: group.id,
				value: !group.oneAtATime,
			})
			.catch(handleError)
	}, [group.id, group.oneAtATime, handleError, ipcServer, rundownId])

	// Loop button:
	const toggleLoop = useCallback(() => {
		ipcServer
			.toggleGroupLoop({
				rundownId,
				groupId: group.id,
				value: !group.loop,
			})
			.catch(handleError)
	}, [group.id, group.loop, handleError, ipcServer, rundownId])

	// Auto-play button:
	const toggleAutoPlay = useCallback(() => {
		ipcServer
			.toggleGroupAutoplay({
				rundownId,
				groupId: group.id,
				value: !group.autoPlay,
			})
			.catch(handleError)
	}, [group.autoPlay, group.id, handleError, ipcServer, rundownId])

	const assignedAreas = computed(() =>
		allAssignedAreas.filter((assignedArea) => assignedArea.assignedToGroupId === group.id)
	)

	const [partButtonAreaPopoverAnchorEl, setPartButtonAreaPopoverAnchorEl] = React.useState<Element | null>(null)
	const buttonAreaPopoverOpen = Boolean(partButtonAreaPopoverAnchorEl)

	const [partAutoFillPopoverAnchorEl, setPartAutoFillPopoverAnchorEl] = React.useState<Element | null>(null)
	const autoFillPopoverOpen = Boolean(partAutoFillPopoverAnchorEl)

	// When the Group isn't in view, don't render the parts, but instead render a placeholder of the same height
	const contentPartsRef = useRef<HTMLDivElement | null>(null)
	const [hidePartsHeight, setHidePartsHeight] = useState<number | null>(DEFAULT_PART_HEIGHT * group.partIds.length)
	const onChange = useCallback((isVisible: boolean) => {
		if (isVisible) {
			setHidePartsHeight(null)
		} else {
			setHidePartsHeight((prevHeight) => {
				if (prevHeight === null) {
					if (contentPartsRef.current) {
						return contentPartsRef.current.clientHeight
					} else {
						return DEFAULT_PART_HEIGHT * group.partIds.length
					}
				} else {
					return prevHeight
				}
			})
		}
	}, [])

	// Optimize, so that PartView isn't re-rendered on every part group change

	if (group.transparent) {
		if (group.partIds.length > 1) {
			return (
				<div>
					ERROR: Transparent Group &quot;{group.id}&quot; has more than 1 ({group.partIds.length}) Parts.
				</div>
			)
		}

		const firstPartId = group.partIds[0] as string | undefined
		return firstPartId ? (
			<div ref={wrapperRef} data-drop-handler-id={handlerId} className="group--transparent">
				<PartView
					rundownId={rundownId}
					partId={firstPartId}
					parentGroupId={group.id}
					parentGroupIndex={groupIndex}
					partIndex={0}
					mappings={mappings}
				/>
			</div>
		) : null
	} else {
		const canModifyOneAtATime = !(!group.oneAtATime && anyPartIsPlaying) && !group.locked

		const canModifyLoop = group.oneAtATime && !group.locked
		const canModifyAutoPlay = group.oneAtATime && !group.locked
		const canAssignAreas = allAvailableAreas.length > 0 && !group.locked
		const canSetAutoFill = !group.locked

		return (
			<VisibilitySensor onChange={onChange} partialVisibility={true}>
				<div
					ref={wrapperRef}
					className={classNames('group', {
						disabled: group.disabled,
						collapsed: groupCollapsed,
						dragging: isDragging,
					})}
					data-drop-handler-id={handlerId}
				>
					<div className="group__dragArrow" />
					<div className="group__header">
						<div
							ref={dragRef}
							className="group__drag-handle"
							style={{ visibility: group.locked ? 'hidden' : 'visible' }}
						>
							<MdOutlineDragIndicator color="rgba(255, 255, 255, 0.5)" />
						</div>

						<div
							className={classNames('collapse', { 'collapse--collapsed': groupCollapsed })}
							title={groupCollapsed ? 'Expand Group' : 'Collapse Group'}
						>
							<MdChevronRight size={22} onClick={handleCollapse} />
						</div>

						{!editingGroupName && (
							<div
								className="title"
								title={group.locked ? group.name : 'Click to edit Group name'}
								onClick={() => {
									if (group.locked) {
										return
									}
									setEditingGroupName(true)
								}}
							>
								{group.name}
							</div>
						)}

						{editingGroupName && (
							<TextField
								size="small"
								value={editedName}
								autoFocus
								variant="standard"
								className="edit-title"
								sx={{ marginTop: '0.3rem' }}
								InputProps={{ style: { fontSize: '1.3rem' } }}
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
									if (e.key === 'Escape') setEditingGroupName(false)
									else if (e.key === 'Enter') submitNameEdit()
								}}
							/>
						)}

						<div className="controls">
							<div className="playback">
								<ControlButtons rundownId={rundownId} group={group} />
								<Button
									variant="contained"
									size="small"
									disabled={!canStepDown}
									onClick={handleStepDown}
									sx={{ visibility: group.oneAtATime ? 'visible' : 'hidden' }}
									title="Play next"
								>
									<div style={{ transform: 'rotate(90deg) translateY(3px)' }}>
										<AiFillStepForward size={22} />
									</div>
								</Button>
								<Button
									variant="contained"
									size="small"
									disabled={!canStepUp}
									onClick={handleStepUp}
									sx={{ visibility: group.oneAtATime ? 'visible' : 'hidden' }}
									title="Play previous"
								>
									<div style={{ transform: 'rotate(-90deg) translateY(3px)' }}>
										<AiFillStepForward size={22} />
									</div>
								</Button>
							</div>

							<ToggleButton
								title={
									group.disabled
										? 'Playout disabled.\n\nClick to enable playout of Group.'
										: 'Disable playout of Group.'
								}
								value="disabled"
								selected={group.disabled}
								size="small"
								onChange={toggleDisable}
							>
								{group.disabled ? <RiEyeCloseLine size={18} /> : <IoMdEye size={18} />}
							</ToggleButton>
							<ToggleButton
								title={group.locked ? 'Locked.\n\n Click to unlock.' : 'Lock Group for editing.'}
								value="locked"
								selected={group.locked}
								size="small"
								onChange={toggleLock}
							>
								{group.locked ? <MdLock size={18} /> : <MdLockOpen size={18} />}
							</ToggleButton>

							<ToggleButton
								title={
									group.oneAtATime
										? 'The Group plays one Part at a time (like a playlist).\n\nClick to set Group to play Parts independently of each other.'
										: 'Parts are played independently of each other.\n\nClick to set Group to instead play one Part at a time (like a playlist).'
								}
								value="one-at-a-time"
								selected={group.oneAtATime}
								size="small"
								disabled={!canModifyOneAtATime}
								onChange={toggleOneAtATime}
							>
								<MdLooksOne size={22} />
							</ToggleButton>

							<ToggleButton
								title={
									group.loop
										? 'Playout Loop enabled.\n\nClick to disable.'
										: 'Click to set Group to Loop playout.'
								}
								value="loop"
								selected={group.oneAtATime && group.loop}
								size="small"
								disabled={!canModifyLoop}
								onChange={toggleLoop}
							>
								<MdRepeat size={18} />
							</ToggleButton>

							<ToggleButton
								title={
									group.autoPlay
										? 'Auto-step enabled.\n\nClick to disable.'
										: 'Enable Auto-step (continue to next Part on end, like a playlist).'
								}
								value="auto-step"
								selected={group.oneAtATime && group.autoPlay}
								size="small"
								disabled={!canModifyAutoPlay}
								onChange={toggleAutoPlay}
							>
								<MdPlaylistPlay size={22} />
							</ToggleButton>

							<ToggleButton
								title={
									group.disabled
										? 'Playout disabled.\n\nClick to enable playout of Group.'
										: 'Disable playout of Group.'
								}
								value="disabled"
								selected={group.disabled}
								size="small"
								disabled={group.locked}
								onChange={toggleDisable}
							>
								{group.disabled ? <RiEyeCloseLine size={18} /> : <IoMdEye size={18} />}
							</ToggleButton>
							<ToggleButton
								title={group.locked ? 'Locked.\n\n Click to unlock.' : 'Lock Group for editing.'}
								value="locked"
								selected={group.locked}
								size="small"
								onChange={toggleLock}
							>
								{group.locked ? <MdLock size={18} /> : <MdLockOpen size={18} />}
							</ToggleButton>

							<ToggleButton
								title={
									group.oneAtATime
										? 'The Group plays one Part at a time (like a playlist).\n\nClick to set Group to play Parts independently of each other.'
										: 'Parts are played independently of each other.\n\nClick to set Group to instead play one Part at a time (like a playlist).'
								}
								value="one-at-a-time"
								selected={group.oneAtATime}
								size="small"
								disabled={!canModifyOneAtATime}
								onChange={toggleOneAtATime}
							>
								<MdLooksOne size={22} />
							</ToggleButton>

							<ToggleButton
								title={
									group.loop
										? 'Playout Loop enabled.\n\nClick to disable.'
										: 'Click to set Group to Loop playout.'
								}
								value="loop"
								selected={group.oneAtATime && group.loop}
								size="small"
								disabled={!canModifyLoop}
								onChange={toggleLoop}
							>
								<MdRepeat size={18} />
							</ToggleButton>

							<ToggleButton
								title={
									group.autoPlay
										? 'Auto-step enabled.\n\nClick to disable.'
										: 'Enable Auto-step (continue to next Part on end, like a playlist).'
								}
								value="auto-step"
								selected={group.oneAtATime && group.autoPlay}
								size="small"
								disabled={!canModifyAutoPlay}
								onChange={toggleAutoPlay}
							>
								<MdPlaylistPlay size={22} />
							</ToggleButton>

							<ToggleButton
								title={
									'Assign Button Area' +
									(group.locked ? ' (disabled due to locked Part or Group)' : '')
								}
								value="assign-area"
								selected={assignedAreas.get().length > 0}
								size="small"
								disabled={!canAssignAreas}
								onChange={(event) => {
									setPartButtonAreaPopoverAnchorEl(event.currentTarget)
								}}
							>
								{assignedAreas.get().length > 0 ? (
									<BsKeyboardFill color="white" size={24} />
								) : (
									<BsKeyboard color="white" size={24} />
								)}
							</ToggleButton>
							<Popover
								open={buttonAreaPopoverOpen}
								anchorEl={partButtonAreaPopoverAnchorEl}
								onClose={() => {
									setPartButtonAreaPopoverAnchorEl(null)
								}}
								anchorOrigin={{
									vertical: 'bottom',
									horizontal: 'left',
								}}
							>
								<GroupButtonAreaPopover group={group} />
							</Popover>

							<ToggleButton
								title={'Auto-fill'}
								value="auto-fill"
								selected={group.autoFill.enable}
								size="small"
								disabled={!canSetAutoFill}
								onChange={(event) => {
									setPartAutoFillPopoverAnchorEl(event.currentTarget)
								}}
							>
								{group.autoFill.enable ? (
									<BsLightningFill color="white" size={24} />
								) : (
									<BsLightning color="white" size={24} />
								)}
							</ToggleButton>
							<Popover
								open={autoFillPopoverOpen}
								anchorEl={partAutoFillPopoverAnchorEl}
								onClose={() => {
									setPartAutoFillPopoverAnchorEl(null)
								}}
								anchorOrigin={{
									vertical: 'bottom',
									horizontal: 'left',
								}}
							>
								<GroupAutoFillPopover rundownId={rundownId} group={group} />
							</Popover>

							<ToggleButton
								title={'Auto-fill'}
								value="auto-fill"
								selected={group.autoFill.enable}
								size="small"
								disabled={!canSetAutoFill}
								onChange={(event) => {
									setPartAutoFillPopoverAnchorEl(event.currentTarget)
								}}
							>
								{group.autoFill.enable ? (
									<BsLightningFill color="white" size={24} />
								) : (
									<BsLightning color="white" size={24} />
								)}
							</ToggleButton>
							<Popover
								open={autoFillPopoverOpen}
								anchorEl={partAutoFillPopoverAnchorEl}
								onClose={() => {
									setPartAutoFillPopoverAnchorEl(null)
								}}
								anchorOrigin={{
									vertical: 'bottom',
									horizontal: 'left',
								}}
							>
								<GroupAutoFillPopover rundownId={rundownId} group={group} />
							</Popover>

							<DuplicateBtn className="duplicate" title="Duplicate Group" onClick={handleDuplicate} />

							<TrashBtn
								className="delete"
								disabled={group.locked}
								title={'Delete Group' + (group.locked ? ' (disabled due to locked Group)' : '')}
								onClick={handleDeleteClick}
							/>
						</div>
					</div>
					{!groupCollapsed && (
						<div className="group__content">
							<div
								className="group__content__parts"
								ref={contentPartsRef}
								style={{
									height: hidePartsHeight ? `${hidePartsHeight}px` : undefined,
								}}
							>
								{hidePartsHeight === null &&
									group.partIds.map((partId, index) => (
										<PartView
											key={partId}
											rundownId={rundownId}
											partId={partId}
											parentGroupId={group.id}
											parentGroupIndex={groupIndex}
											partIndex={index}
											mappings={mappings}
										/>
									))}
							</div>

							{!group.locked && <GroupOptions rundownId={rundownId} group={group} />}
						</div>
					)}

					<ConfirmationDialog
						open={deleteConfirmationOpen}
						title="Delete Group"
						body={`Are you sure you want to delete the group "${group.name}"?`}
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
			</VisibilitySensor>
		)
	}
})

const GroupOptions: React.FC<{ rundownId: string; group: GroupGUI }> = ({ rundownId, group }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [newPartOpen, setNewPartOpen] = React.useState(false)

	const wrapperRef = useRef<HTMLDivElement>(null)

	const [{ handlerId, isOver }, drop] = useDrop(
		{
			accept: DragItemTypes.RESOURCE_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
					isOver: monitor.isOver(),
				}
			},
			canDrop: (movedItem) => {
				return isResourceDragItem(movedItem)
			},
			drop: async (droppedItem) => {
				try {
					if (!isResourceDragItem(droppedItem)) {
						return
					}

					const { partId } = await ipcServer.newPart({
						rundownId: rundownId,
						groupId: group.id,
						name:
							'name' in droppedItem.resource
								? (droppedItem.resource as any).name
								: droppedItem.resource.id,
					})

					await ipcServer.addResourceToTimeline({
						rundownId: rundownId,
						groupId: group.id,
						partId,
						layerId: null,
						resourceId: droppedItem.resource.id,
					})
				} catch (error) {
					handleError(error)
				}
			},
		},
		[rundownId, group.id]
	)

	useEffect(() => {
		drop(wrapperRef)
	}, [drop])

	return (
		<>
			<DropZone
				ref={wrapperRef}
				className="group-list__control-row"
				data-drop-handler-id={handlerId}
				isOver={isOver}
			>
				<Btn variant="contained" onClick={() => setNewPartOpen(true)}>
					New part
				</Btn>
			</DropZone>

			<PartPropertiesDialog
				open={newPartOpen}
				title="New Part"
				acceptLabel="Create"
				initial={{ name: `Part ${group.partIds.length + 1}` }}
				onAccepted={(newPart) => {
					ipcServer
						.newPart({
							rundownId: rundownId,
							name: newPart.name,
							groupId: group.id,
						})
						.catch(handleError)
					setNewPartOpen(false)
				}}
				onDiscarded={() => {
					setNewPartOpen(false)
				}}
			/>
		</>
	)
}

const ControlButtons: React.FC<{
	rundownId: string
	group: GroupGUI
}> = observer(function ControlButtons({ rundownId, group }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	// Stop button:
	const handleStop = useCallback(() => {
		ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(handleError)
	}, [handleError, ipcServer, rundownId, group.id])

	// Play button:
	const handlePlay = useCallback(() => {
		ipcServer.playGroup({ rundownId, groupId: group.id }).catch(handleError)
	}, [handleError, ipcServer, rundownId, group.id])

	// Pause button
	const handlePause = useCallback(() => {
		ipcServer.pauseGroup({ rundownId, groupId: group.id }).catch(handleError)
	}, [handleError, ipcServer, rundownId, group.id])

	const { groupIsPlaying, anyPartIsPlaying, allPartsArePaused, partIsPlaying, partIsPaused, playheadCount } =
		useMemoComputedObject(() => {
			const playData = store.groupPlayDataStore.groups.get(group.id)

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
			return {
				groupIsPlaying: playData.groupIsPlaying,
				anyPartIsPlaying: playData.anyPartIsPlaying,
				allPartsArePaused: playData.allPartsArePaused,
				playheadCount: Object.keys(playData.playheads).length,
				partIsPlaying: false,
				partIsPaused: false,
			}
		}, [group.id])

	const groupDisabled = group.disabled || false
	const groupOneAtATime = group.oneAtATime || false
	const countPlayablePartsInGroup = useMemoComputedValue(() => {
		const groupWithParts = store.rundownsStore.getGroupWithParts(group.id)
		return groupWithParts.parts.filter((p) => !p.disabled).length
	}, [group.id])

	const data: PlayButtonData = {
		groupDisabled,
		groupOneAtATime,
		countPlayablePartsInGroup,

		groupIsPlaying,
		anyPartIsPlaying,
		allPartsArePaused,
		partIsPlaying,
		partIsPaused,
		playheadCount,
	}

	return (
		<>
			<StopBtn className="part__stop" groupId={group.id} data={data} onClick={handleStop} />
			<PlayBtn groupId={group.id} data={data} onClick={handlePlay} />
			<PauseBtn groupId={group.id} data={data} onClick={handlePause} />
		</>
	)
})
