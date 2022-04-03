import React, { useEffect, useRef, useState, useContext, useCallback, useMemo } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '../../../../models/rundown/Group'
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
import { Button, TextField, ToggleButton } from '@mui/material'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { assertNever } from '@shared/lib'
import { allowMovingItemIntoGroup, getNextPartIndex, getPrevPartIndex } from '../../../../lib/util'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { Rundown } from '../../../../models/rundown/Rundown'
import { RundownContext } from '../../../contexts/Rundown'
import { DropZone } from '../../util/DropZone'
import {
	MdChevronRight,
	MdLock,
	MdLockOpen,
	MdLooksOne,
	MdPlaylistPlay,
	MdStop,
	MdRepeat,
	MdOutlineDragIndicator,
} from 'react-icons/md'
import { IoMdEye } from 'react-icons/io'
import { RiEyeCloseLine } from 'react-icons/ri'
import { AiFillStepForward } from 'react-icons/ai'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import shortUUID from 'short-uuid'
import { computed } from 'mobx'
import { PlayBtn } from '../../inputs/PlayBtn/PlayBtn'

export const GroupView: React.FC<{
	rundownId: string
	group: Group
	groupIndex: number
	mappings: Mappings
}> = observer(({ group, groupIndex, rundownId, mappings }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const hotkeyContext = useContext(HotkeyContext)
	const rundown = useContext(RundownContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const [editingGroupName, setEditingGroupName] = useState(false)
	const [editedName, setEditedName] = useState(group.name)
	useEffect(() => {
		setEditedName(group.name)
	}, [group.name])
	const submitNameEdit = useCallback(() => {
		ipcServer
			.updateGroup({
				rundownId,
				groupId: group.id,
				group: {
					...group,
					name: editedName,
				},
			})
			.catch(handleError)
		setEditingGroupName(false)
	}, [editedName, group, handleError, ipcServer, rundownId])

	const playheadData = useRef<GroupPreparedPlayData | null>(null)
	const [_activeParts, setActiveParts] = useState<{ [partId: string]: true }>({})
	useEffect(() => {
		playheadData.current = group.preparedPlayData

		// console.log('playheadData', playheadData.current)

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
				// console.log('Auto-stopping group', group.id)
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
				store.guiStore.updateGroupMove({
					groupId: group.id,
					position: groupIndex,
					moveId: shortUUID.generate(),
				})
				return {
					type: DragItemTypes.GROUP_ITEM,
					groupId: group.id,
				}
			},
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			isDragging: (monitor) => {
				return group.id === monitor.getItem().groupId
			},
			end: () => {
				store.guiStore.updateGroupMove({
					done: true,
				})
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
					if (!wrapperRef.current) {
						return
					}

					// Don't replace items with themselves
					if (movedItem.groupId === group.id) {
						return
					}

					const dragIndex = store.guiStore.groupMove.position
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

					store.guiStore.updateGroupMove({
						position: hoverIndex,
					})
				} else if (isPartDragItem(movedItem)) {
					if (!monitor.isOver({ shallow: true })) {
						return
					}

					if (!wrapperRef.current) {
						return
					}

					const dragIndex = store.guiStore.partMove.position
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

					/**
					 * Defines a band of pixels around the vertical middle of the Group,
					 * used to determine how to handle this hover event depending on if
					 * the user's cursor is within this band or not.
					 */
					const midBand = hoverBoundingRect.height / 3 / 2

					/**
					 * An array of this Group's Parts, minus the Part currently being dragged.
					 */
					const groupPartsWithoutMovedPart = group.parts.filter((p) => p.id !== movedItem.partId)

					if (groupPartsWithoutMovedPart.length <= 0 && Math.abs(hoverClientY - hoverMiddleY) <= midBand) {
						// If the group is empty, and if the user's cursor is hovering within midBand
						// pixels of the group's vertical center, then we assume that the user wants to move
						// the Part into the hovered Group.

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
						store.guiStore.updatePartMove({
							toGroupId: hoverGroup.id,
							position: hoverIndex,
						})

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
							store.guiStore.updatePartMove({
								toGroupId: null,
								position: hoverIndex,
							})
							movedItem.position = hoverIndex
						} else {
							store.guiStore.updatePartMove({
								toGroupId: null,
								position: hoverIndex + 1,
							})
							movedItem.position = hoverIndex + 1
						}

						movedItem.toGroupId = null
					}
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
	const handleDelete = () => {
		ipcServer.deleteGroup({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Stop button:
	const canStop = anyPartIsPlaying
	const handleStop = () => {
		ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Play button:
	const handlePlay = () => {
		ipcServer.playGroup({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Step down button:
	const nextPartIndex = useMemo(() => getNextPartIndex(group), [group])
	const nextPart = group.parts[nextPartIndex]
	const canStepDown = !group.disabled && anyPartIsPlaying && Boolean(nextPart)
	const handleStepDown = () => {
		ipcServer.playNext({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Step down up:
	const prevPartIndex = useMemo(() => getPrevPartIndex(group), [group])
	const prevPart = group.parts[prevPartIndex]
	const canStepUp = !group.disabled && anyPartIsPlaying && Boolean(prevPart)
	const handleStepUp = () => {
		ipcServer.playPrev({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Collapse button:
	const handleCollapse = () => {
		ipcServer.toggleGroupCollapse({ rundownId, groupId: group.id, value: !group.collapsed }).catch(handleError)
	}

	if (group.transparent) {
		const firstPart = group.parts[0]
		return firstPart ? (
			<div ref={wrapperRef} data-drop-handler-id={handlerId} className="group--transparent">
				<PartView
					rundownId={rundownId}
					part={firstPart}
					parentGroup={group}
					parentGroupIndex={groupIndex}
					mappings={mappings}
				/>
			</div>
		) : null
	} else {
		const canModifyOneAtATime = !(!group.oneAtATime && anyPartIsPlaying) && !group.locked
		// (group.oneAtATime && playhead.anyPartIsPlaying) || !group.oneAtATime
		// || !group.oneAtATime // && !playhead.groupIsPlaying

		const canModifyLoop = group.oneAtATime && !group.locked
		const canModifyAutoPlay = group.oneAtATime && !group.locked

		return (
			<div
				ref={wrapperRef}
				className={classNames('group', {
					disabled: group.disabled,
					collapsed: group.collapsed,
					dragging: isDragging,
				})}
				data-drop-handler-id={handlerId}
			>
				<div className="group__dragArrow" />
				<div className="group__header">
					<div ref={dragRef} className="group__drag-handle">
						{!group.locked && <MdOutlineDragIndicator color="rgba(255, 255, 255, 0.5)" />}
					</div>

					<div
						className={classNames('collapse', { 'collapse--collapsed': group.collapsed })}
						title={group.collapsed ? 'Expand Group' : 'Collapse Group'}
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
							<Button
								variant="contained"
								size="small"
								disabled={group.disabled || !canStop}
								onClick={handleStop}
								title={group.oneAtATime ? 'Stop' : 'Stop playout of all Parts in Group'}
							>
								<MdStop size={22} />
							</Button>
							<PlayBtn group={group} onClick={handlePlay} />
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
							onChange={() => {
								ipcServer
									.toggleGroupDisable({
										rundownId,
										groupId: group.id,
										value: !group.disabled,
									})
									.catch(handleError)
							}}
						>
							{group.disabled ? <RiEyeCloseLine size={18} /> : <IoMdEye size={18} />}
						</ToggleButton>
						<ToggleButton
							title={group.locked ? 'Locked.\n\n Click to unlock.' : 'Lock Group for editing.'}
							value="locked"
							selected={group.locked}
							size="small"
							onChange={() => {
								ipcServer
									.toggleGroupLock({
										rundownId,
										groupId: group.id,
										value: !group.locked,
									})
									.catch(handleError)
							}}
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
							onChange={() => {
								ipcServer
									.toggleGroupOneAtATime({
										rundownId,
										groupId: group.id,
										value: !group.oneAtATime,
									})
									.catch(handleError)
							}}
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
							onChange={() => {
								ipcServer
									.toggleGroupLoop({
										rundownId,
										groupId: group.id,
										value: !group.loop,
									})
									.catch(handleError)
							}}
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
							onChange={() => {
								ipcServer
									.toggleGroupAutoplay({
										rundownId,
										groupId: group.id,
										value: !group.autoPlay,
									})
									.catch(handleError)
							}}
						>
							<MdPlaylistPlay size={22} />
						</ToggleButton>

						<TrashBtn
							className="delete"
							disabled={group.locked}
							title={'Delete Group' + (group.locked ? ' (disabled due to locked Group)' : '')}
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
					</div>
				</div>
				{!group.collapsed && (
					<div className="group__content">
						<div className="group__content__parts">
							{group.parts.map((part) => (
								<PartView
									key={part.id}
									rundownId={rundownId}
									part={part}
									parentGroup={group}
									parentGroupIndex={groupIndex}
									mappings={mappings}
								/>
							))}
						</div>

						{!group.locked && <GroupOptions rundown={rundown} group={group} />}
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
		)
	}
})

const GroupOptions: React.FC<{ rundown: Rundown; group: Group }> = ({ rundown, group }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [newPartOpen, setNewPartOpen] = React.useState(false)

	const numParts = useMemo(() => {
		return rundown.groups.reduce((prev, current) => {
			return prev + current.parts.length
		}, 0)
	}, [rundown])

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
						rundownId: rundown.id,
						groupId: group.id,
						name:
							'name' in droppedItem.resource
								? (droppedItem.resource as any).name
								: droppedItem.resource.id,
					})

					await ipcServer.addResourceToTimeline({
						rundownId: rundown.id,
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
		[rundown, group]
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
				<Button className="btn" variant="contained" onClick={() => setNewPartOpen(true)}>
					New part
				</Button>
			</DropZone>

			<PartPropertiesDialog
				open={newPartOpen}
				title="New Part"
				acceptLabel="Create"
				initial={{ name: `Part ${numParts + 1}` }}
				onAccepted={(newPart) => {
					ipcServer
						.newPart({
							rundownId: rundown.id,
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
