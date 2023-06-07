import React, { useEffect, useRef, useState, useContext, useCallback } from 'react'
import sorensen from '@sofie-automation/sorensen'
import { TrashBtn } from '../../inputs/TrashBtn'
import { GroupBase, GroupGUI } from '../../../../models/rundown/Group'
import { PartView } from './PartView'
import { GroupPreparedPlayData, SectionEndAction } from '../../../../models/GUI/PreparedPlayhead'
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
import { allowMovingPartIntoGroup, getNextPartIndex, getPrevPartIndex, MoveTarget } from '../../../../lib/util'
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
import { useMemoComputedObject, useMemoComputedValue, useMemoObject } from '../../../mobx/lib'
import { BsKeyboard, BsKeyboardFill, BsLightning, BsLightningFill } from 'react-icons/bs'
import { GroupButtonAreaPopover } from './GroupButtonAreaPopover'
import { GroupAutoFillPopover } from './GroupAutoFillPopover'
import VisibilitySensor from 'react-visibility-sensor'
import { Btn } from '../../inputs/Btn/Btn'
import { sortSelected } from '../../../lib/clientUtil'
import _ from 'lodash'
import { formatDateTime, formatDuration } from '../../../../lib/timeLib'
import { ErrorBoundary } from '../../util/ErrorBoundary'
import { DISPLAY_DECIMAL_COUNT } from '../../../constants'
import { useFrame } from '../../../lib/useFrame'
import { AntiWiggle } from '../../util/AntiWiggle/AntiWiggle'

const DEFAULT_PART_HEIGHT = 80

export const GroupView: React.FC<{
	rundownId: string
	groupId: string
	mappings: Mappings
}> = observer(function GroupView({ groupId, rundownId, mappings }) {
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

		const activeParts0: { [partId: string]: true } = {}

		if (group.preparedPlayData) {
			if (group.preparedPlayData.type === 'single') {
				for (const section of group.preparedPlayData.sections) {
					for (const part of section.parts) {
						activeParts0[part.part.id] = true
					}
				}
			} else if (group.preparedPlayData.type === 'multi') {
				for (const partId of Object.keys(group.preparedPlayData.sections)) {
					activeParts0[partId] = true
				}
			} else {
				assertNever(group.preparedPlayData)
			}
		}
		setActiveParts(activeParts0)
	}, [group])

	const groupIsPlaying = computed(() => store.groupPlayDataStore.groups.get(group.id)?.groupIsPlaying || false).get()
	const groupWillPlay = computed(
		() => (store.groupPlayDataStore.groups.get(group.id)?.groupScheduledToPlay ?? []).length > 0 || false
	).get()
	const playingPartCount = computed(
		() => Object.keys(store.groupPlayDataStore.groups.get(group.id)?.playheads || {}).length
	).get()

	const selectable = true
	const isSelected = computed(() =>
		store.guiStore.isSelected({
			type: 'group',
			groupId,
		})
	)

	const updateSelection = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (!selectable) return
		const targetEl = event.target as HTMLElement

		if (
			targetEl.closest('.part') ||
			targetEl.closest('.controls-left>*') ||
			targetEl.closest('.controls-right>*') ||
			targetEl.closest('button') ||
			targetEl.closest('input') ||
			targetEl.closest('.editable') ||
			targetEl.closest('.MuiModal-root')
		)
			return

		const pressed = sorensen.getPressedKeys()
		if (pressed.includes('ControlLeft') || pressed.includes('ControlRight')) {
			// Add this group to the selection:
			store.guiStore.toggleAddSelected({
				type: 'group',
				groupId,
			})
		} else if (pressed.includes('ShiftLeft') || pressed.includes('ShiftRight')) {
			// Add all groups between the last selected and this one:
			const mainSelected = store.guiStore.mainSelected
			if (mainSelected && mainSelected.type === 'group') {
				const allGroups = store.rundownsStore.getRundownGroups(rundownId)

				const mainIndex = allGroups.findIndex((g) => g.id === mainSelected.groupId)
				const thisIndex = allGroups.findIndex((g) => g.id === groupId)
				if (mainIndex === -1 || thisIndex === -1) return
				if (mainIndex < thisIndex) {
					for (let i = mainIndex + 1; i <= thisIndex; i++) {
						store.guiStore.addSelected({
							type: 'group',
							groupId: allGroups[i].id,
						})
					}
				} else if (mainIndex > thisIndex) {
					for (let i = mainIndex - 1; i >= thisIndex; i--) {
						store.guiStore.addSelected({
							type: 'group',
							groupId: allGroups[i].id,
						})
					}
				}
			}
		} else {
			store.guiStore.toggleSelected({
				type: 'group',
				groupId,
			})
		}
	}

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
				// If this Group isn't included in the current selection, select it:
				if (
					!store.guiStore.isSelected({
						type: 'group',
						groupId: group.id,
					})
				) {
					store.guiStore.setSelected({
						type: 'group',
						groupId: group.id,
					})
				}

				const selectedGroups = sortSelected(
					rundownId,
					store.rundownsStore,
					store.guiStore.getSelectedOfType('group')
				)
				return {
					type: DragItemTypes.GROUP_ITEM,
					groupIds: selectedGroups.map((g) => g.groupId),
					target: null,
				}
			},
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			isDragging: (monitor) => {
				return !!monitor.getItem().groupIds.find((groupId) => groupId === group.id)
			},
			end: () => {
				store.rundownsStore.commitMoveGroupInCurrentRundown()?.catch(handleError)
			},
		},
		[group.id, store.guiStore]
	)
	const [{ handlerId }, drop] = useDrop(
		// Use case 1: Drag Parts over this Group, to insert the Parts into this Group
		// Use case 2: Drag Groups over this Group, to insert the Groups above or below this Group
		{
			accept: [DragItemTypes.PART_ITEM, DragItemTypes.GROUP_ITEM],
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			canDrop: (movedItem) => {
				if (isGroupDragItem(movedItem)) {
					return true
				} else if (isPartDragItem(movedItem)) {
					for (const movePart of movedItem.parts) {
						if (!allowMovingPartIntoGroup(movePart.partId, movePart.fromGroup, group)) {
							return false
						}
					}
				}
				return false
			},
			hover(movedItem, monitor) {
				if (isGroupDragItem(movedItem)) {
					// Is dragging a Group
					if (!wrapperRef.current) {
						return
					}

					// Don't replace items with themselves
					if (movedItem.groupIds.find((groupId) => groupId === group.id)) {
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

					let target: MoveTarget
					if (hoverClientY < hoverMiddleY) {
						target = {
							type: 'before',
							id: group.id,
						}
					} else {
						target = {
							type: 'after',
							id: group.id,
						}
					}

					store.rundownsStore.moveGroupsInCurrentRundown(movedItem.groupIds, target)
					movedItem.target = target
				} else if (isPartDragItem(movedItem)) {
					// Is dragging a Part
					if (!monitor.isOver({ shallow: true })) {
						return
					}

					if (!wrapperRef.current) {
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

					// If the cursor is over these, we assume the user is trying to move the Part to before or after the Group
					const headerHeight = 20
					const footerHeight = 20
					const headerY = 0 + headerHeight
					const footerY = hoverBoundingRect.height - footerHeight

					if (hoverClientY < headerY) {
						const target: MoveTarget = {
							type: 'before',
							id: group.id,
						}

						store.rundownsStore.movePartsInCurrentRundown(
							movedItem.parts.map((p) => p.partId),
							null,
							target
						)
						movedItem.toGroupId = null
						movedItem.target = target
					} else if (hoverClientY > footerY) {
						const target: MoveTarget = {
							type: 'after',
							id: group.id,
						}
						store.rundownsStore.movePartsInCurrentRundown(
							movedItem.parts.map((p) => p.partId),
							null,
							target
						)
						movedItem.toGroupId = null
						movedItem.target = target
					} else {
						// The pointer is inside of the group
						let target: MoveTarget

						if (hoverClientY < hoverMiddleY) {
							target = {
								type: 'first',
							}
						} else {
							target = {
								type: 'last',
							}
						}

						store.rundownsStore.movePartsInCurrentRundown(
							movedItem.parts.map((p) => p.partId),
							group.id,
							target
						)

						movedItem.toGroupId = group.id
						movedItem.target = target
					}
					return
				}
			},
		},
		[group]
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

	// Collapse button:
	const handleCollapse = useCallback(() => {
		ipcServer
			.toggleGroupCollapse({
				rundownId,
				groupId: group.id,
				value: !group.collapsed,
			})
			.catch(handleError)
	}, [group.collapsed, group.id, handleError, ipcServer, rundownId])

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
	const onChange = useCallback(
		(isVisible: boolean) => {
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
		},
		[group.partIds.length]
	)

	const groupBase = useMemoObject(() => _.omit(group, ['partIds']) as GroupBase, [group], true)

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
			<div
				ref={wrapperRef}
				data-drop-handler-id={handlerId}
				className={classNames('group--transparent', {
					dragging: isDragging,
				})}
			>
				<ErrorBoundary>
					<PartView rundownId={rundownId} partId={firstPartId} parentGroupId={group.id} mappings={mappings} />
				</ErrorBoundary>
			</div>
		) : null
	} else {
		const canModifyOneAtATime = (group.oneAtATime ? true : playingPartCount <= 1) && !group.locked

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
						collapsed: group.collapsed,
						dragging: isDragging,
						selected: isSelected.get(),
						selectable: selectable,
					})}
					data-drop-handler-id={handlerId}
					onClick={updateSelection}
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
							className={classNames('collapse', { 'collapse--collapsed': group.collapsed })}
							title={group.collapsed ? 'Expand Group' : 'Collapse Group'}
						>
							<MdChevronRight size={22} onClick={handleCollapse} />
						</div>

						<div className="title-container">
							{editingGroupName ? (
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
							) : (
								<div
									className={classNames('title', group.locked ? undefined : 'editable')}
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
						</div>

						<div className="controls controls-left">
							<div className="playback">
								{groupWillPlay && (
									<>
										<GroupCountDown rundownId={rundownId} group={groupBase} />
									</>
								)}
								<GroupControlButtons rundownId={rundownId} group={groupBase} />
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
						</div>
						<div className="controls controls-space"></div>
						<div className="controls controls-right">
							<DuplicateBtn className="duplicate" title="Duplicate Group" onClick={handleDuplicate} />

							<TrashBtn
								className="delete"
								disabled={group.locked}
								title={'Delete Group' + (group.locked ? ' (disabled due to locked Group)' : '')}
								onClick={handleDeleteClick}
							/>
						</div>
					</div>
					{!group.collapsed && (
						<div className="group__content">
							<div
								className="group__content__parts"
								ref={contentPartsRef}
								style={{
									height: hidePartsHeight ? `${hidePartsHeight}px` : undefined,
								}}
							>
								{hidePartsHeight === null &&
									group.partIds.map((partId) => (
										<PartView
											key={partId}
											rundownId={rundownId}
											partId={partId}
											parentGroupId={group.id}
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
						acceptLabel="Delete"
						onAccepted={() => {
							handleDelete()
							setDeleteConfirmationOpen(false)
						}}
						onDiscarded={() => {
							setDeleteConfirmationOpen(false)
						}}
					>
						<p>
							Are you sure you want to delete the group &quot;{group.name}&quot;?
							<br />
							<br />
							(Tip: Hold CTRL when clicking the button to skip this dialog)`
						</p>
					</ConfirmationDialog>
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
		// Use case: Drag Resources over this Group, to insert them as Parts into this Group
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

					for (const resource of droppedItem.resources) {
						const { partId } = await ipcServer.newPart({
							rundownId: rundownId,
							groupId: group.id,
							name: '', // resource.displayName
						})

						await ipcServer.addResourcesToTimeline({
							rundownId: rundownId,
							groupId: group.id,
							partId,
							layerId: null,
							resourceIds: [resource.id],
						})
					}
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

				<GroupTimeDisplay group={group} />
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
const GroupTimeDisplay: React.FC<{ group: GroupGUI }> = ({ group }) => {
	if (!group.oneAtATime) return null
	return (
		<div className="group-list__time-display">
			<GroupEndTime groupId={group.id} />
			<GroupRemainingTime group={group} />
		</div>
	)
}
export const GroupEndTime = observer(function RemainingTime(props: { groupId: string }) {
	const { sectionEndTime, sectionTimeToEnd, sectionEndAction, groupIsPlaying } = useMemoComputedObject(
		() => {
			const playData = store.groupPlayDataStore.groups.get(props.groupId)

			return {
				groupIsPlaying: playData?.groupIsPlaying,
				sectionEndTime: playData?.sectionEndTime ?? null,
				sectionTimeToEnd: playData?.sectionTimeToEnd ?? null,
				sectionEndAction: playData?.sectionEndAction,
			}
		},
		[props.groupId],
		true
	)
	const [sectionEndTimeString, setSectionEndTimeString] = useState('')

	useFrame(
		(nowTime: number) => {
			if (!groupIsPlaying) return false // Stop evaluating each frame

			let endTime: number | null
			if (sectionEndTime) {
				endTime = sectionEndTime
			} else if (sectionTimeToEnd) {
				endTime = sectionTimeToEnd + nowTime
			} else {
				endTime = null
			}
			if (!endTime) {
				setSectionEndTimeString('')
				return false // Stop evaluating each frame
			} else {
				setSectionEndTimeString(formatDateTime(endTime, true, DISPLAY_DECIMAL_COUNT))
				return true
			}
		},
		[groupIsPlaying, sectionEndTime, sectionTimeToEnd]
	)

	let label: string
	switch (sectionEndAction) {
		case undefined:
		case null: {
			label = ''
			break
		}
		case SectionEndAction.STOP: {
			label = 'END TIME'
			break
		}
		case SectionEndAction.NEXT_SECTION: {
			// next = go to next section, which must be a loop
			label = 'LOOP TIME'
			break
		}
		case SectionEndAction.LOOP_SELF: {
			label = 'LOOP TIME'
			break
		}
		case SectionEndAction.INFINITE: {
			// Probably paused
			label = 'END TIME'
			break
		}
		default: {
			assertNever(sectionEndAction)
			label = ''
		}
	}

	if (!sectionEndTimeString) return null
	if (!label) return null

	return (
		<div className="group-list__time-display__item">
			<AntiWiggle deps={[label]}>
				<span className="group-list__time-display__label">{label}</span>{' '}
				<span className="group-list__time-display__value">{sectionEndTimeString}</span>
			</AntiWiggle>
		</div>
	)
})
export const GroupRemainingTime = observer(function RemainingTime(props: { group: GroupGUI }) {
	const countDownTimeString = useMemoComputedValue(() => {
		const playData = store.groupPlayDataStore.groups.get(props.group.id)
		if (!playData) return null

		if (!playData.sectionTimeToEnd) return null

		return formatDuration(playData.sectionTimeToEnd, DISPLAY_DECIMAL_COUNT, true)
	}, [props.group.id])

	const durationTimeString = useMemoComputedValue(() => {
		const parts = store.rundownsStore.getGroupParts(props.group.id)

		let duration: number | null = 0
		for (const part of parts) {
			if (duration === null) break
			if (part.resolved.duration === null) duration = null
			else duration += part.resolved.duration
		}

		if (duration === null) return '∞'

		return formatDuration(duration, 'smart')
	}, [props.group.id])

	let label = ''
	let displayString = ''
	if (countDownTimeString) {
		label = 'REMAINING'
		displayString = countDownTimeString
	} else if (durationTimeString) {
		label = 'TOTAL DURATION'
		displayString = durationTimeString
	}
	if (!label) return null
	if (!displayString) return null

	return (
		<div className="group-list__time-display__item">
			<AntiWiggle deps={[label]}>
				<span className="group-list__time-display__label">{label}</span>{' '}
				<span className="group-list__time-display__value">{displayString}</span>
			</AntiWiggle>
		</div>
	)
})

const GroupCountDown: React.FC<{
	rundownId: string
	group: GroupBase
}> = observer(function GroupCountDown({ group }) {
	const nextCoundowns = computed(
		() => store.groupPlayDataStore.groups.get(group.id)?.groupScheduledToPlay ?? []
	).get()

	if (nextCoundowns.length === 0) return null

	return (
		<div className="schedule-countdown">
			<div
				title={
					nextCoundowns
						.slice(0, 10)
						.map((nc) => formatDateTime(nc.timestamp))
						.join('\n') + (nextCoundowns.length > 10 ? '\n...' : '')
				}
			>
				Scheduled start: {formatDuration(nextCoundowns[0].duration, DISPLAY_DECIMAL_COUNT, true)}
			</div>
		</div>
	)
})
const GroupControlButtons: React.FC<{
	rundownId: string
	group: GroupBase
}> = observer(function GroupControlButtons({ rundownId, group }) {
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

	// Step down button:
	const { nextPartExists, prevPartExists } = useMemoComputedObject(() => {
		const groupWithParts = store.rundownsStore.getGroupWithParts(group.id)

		const nextPartIndex = getNextPartIndex(groupWithParts)
		const prevPartIndex = getPrevPartIndex(groupWithParts)

		return {
			nextPartExists: nextPartIndex in groupWithParts.parts,
			prevPartExists: prevPartIndex in groupWithParts.parts,
		}
	}, [group.id])

	const handleStepDown = useCallback(() => {
		ipcServer.playNext({ rundownId, groupId: group.id }).catch(handleError)
	}, [group.id, handleError, ipcServer, rundownId])

	// Step down up:

	const handleStepUp = useCallback(() => {
		ipcServer.playPrev({ rundownId, groupId: group.id }).catch(handleError)
	}, [group.id, handleError, ipcServer, rundownId])

	const { groupIsPlaying, anyPartIsPlaying, allPartsArePaused, partIsPlaying, partIsPaused, playheadCount } =
		useMemoComputedObject(
			() => {
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
			},
			[group.id],
			true
		)

	const groupDisabled = group.disabled || false
	const groupOneAtATime = group.oneAtATime || false
	const countPlayablePartsInGroup = useMemoComputedValue(() => {
		const groupWithParts = store.rundownsStore.getGroupWithParts(group.id)
		return groupWithParts.parts.filter((p) => !p.disabled).length
	}, [group.id])

	const canStepDown = !group.disabled && anyPartIsPlaying && nextPartExists
	const canStepUp = !group.disabled && anyPartIsPlaying && prevPartExists

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
		</>
	)
})
