import React, { useEffect, useRef, useState, useContext, useCallback, useMemo } from 'react'
import _ from 'lodash'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '../../../../models/rundown/Group'
import { PartView } from './PartView'
import { getGroupPlayData, GroupPlayData } from '../../../../lib/playhead'
import { GroupPreparedPlayData } from '../../../../models/GUI/PreparedPlayhead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DragItemTypes, isPartDragItem, isResourceDragItem } from '../../../api/DragItemTypes'
import { useDrop } from 'react-dnd'
import { Mappings } from 'timeline-state-resolver-types'
import { Button, TextField, ToggleButton } from '@mui/material'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { assertNever } from '@shared/lib'
import { allowMovingItemIntoGroup, getNextPartIndex, getPrevPartIndex } from '../../../../lib/util'
import { PartMoveContext } from '../../../contexts/PartMove'
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
	MdPlayArrow,
	MdPlaylistPlay,
	MdStop,
	MdRepeat,
} from 'react-icons/md'
import { IoPlaySkipBackSharp } from 'react-icons/io5'
import { IoMdEye } from 'react-icons/io'
import { RiEyeCloseLine } from 'react-icons/ri'
import { AiFillStepForward } from 'react-icons/ai'
import classNames from 'classnames'

export const GroupView: React.FC<{
	rundownId: string
	group: Group
	groupIndex: number
	mappings: Mappings
}> = ({ group, groupIndex, rundownId, mappings }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const { updatePartMove } = useContext(PartMoveContext)
	const hotkeyContext = useContext(HotkeyContext)
	const rundown = useContext(RundownContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const updatePartMoveRef = useRef(updatePartMove)
	updatePartMoveRef.current = updatePartMove

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

	const [playhead, setPlayhead] = useState<GroupPlayData>(getGroupPlayData(playheadData.current))
	const requestRef = useRef<number>(0)
	const updatePlayhead = useCallback(() => {
		const newPlayhead = getGroupPlayData(playheadData.current)

		setPlayhead((oldPlayhead) => {
			if (!_.isEqual(oldPlayhead, newPlayhead)) {
				return newPlayhead
			} else {
				return oldPlayhead
			}
		})
		requestRef.current = window.requestAnimationFrame(updatePlayhead)
	}, [])
	useEffect(() => {
		requestRef.current = window.requestAnimationFrame(updatePlayhead)
		return () => {
			window.cancelAnimationFrame(requestRef.current)
		}
	}, [updatePlayhead])

	/** Whether we're allowed to stop playing */
	const wasPlayingRef = useRef(false)
	const stopPlayingRef = useRef(true)
	useEffect(() => {
		if (group.preparedPlayData && wasPlayingRef.current && !group.oneAtATime && !playhead.groupIsPlaying) {
			// We believe that we are are playing, but the playhead says otherwise.
			// That probably means that we have reached the end.

			if (stopPlayingRef.current) {
				// Stop the group, so that the "stop"-buttons reflect the correct state:
				console.log('Auto-stopping group', group.id)

				ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(handleError)
				stopPlayingRef.current = false
			}
		} else {
			stopPlayingRef.current = true
		}

		// We are definitely playing
		if (group.preparedPlayData && playhead.groupIsPlaying) {
			wasPlayingRef.current = true
		} else {
			wasPlayingRef.current = false
		}
	}, [playhead, group, ipcServer, rundownId, handleError])

	const wrapperRef = useRef<HTMLDivElement>(null)

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

				return !!allowMovingItemIntoGroup(movedItem.partId, movedItem.fromGroup, group)
			},
			hover(movedItem) {
				if (!isPartDragItem(movedItem)) {
					return
				}

				// Don't use the GroupView as a drop target when there are Parts present.
				if (group.parts.length > 0) {
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
				updatePartMoveRef.current({
					partId: movedItem.partId,
					fromGroupId: movedItem.fromGroup.id,
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
			},
		},
		[group]
	)

	useEffect(() => {
		drop(wrapperRef)
	}, [drop])

	// Delete button:
	const handleDelete = () => {
		ipcServer.deleteGroup({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Stop button:
	const canStop = playhead.anyPartIsPlaying
	const handleStop = () => {
		ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Play button:
	const handlePlay = () => {
		ipcServer.playGroup({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Step down button:
	const nextPartIndex = getNextPartIndex(group)
	const nextPart = group.parts[nextPartIndex]
	const canStepDown = !group.disabled && playhead.anyPartIsPlaying && Boolean(nextPart)
	const handleStepDown = () => {
		ipcServer.playNext({ rundownId, groupId: group.id }).catch(handleError)
	}

	// Step down up:
	const prevPartIndex = getPrevPartIndex(group)
	const prevPart = group.parts[prevPartIndex]
	const canStepUp = !group.disabled && playhead.anyPartIsPlaying && Boolean(prevPart)
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
					playhead={playhead}
					mappings={mappings}
				/>
			</div>
		) : null
	} else {
		const canModifyOneAtATime = !(!group.oneAtATime && playhead.anyPartIsPlaying) && !group.locked
		// (group.oneAtATime && playhead.anyPartIsPlaying) || !group.oneAtATime
		// || !group.oneAtATime // && !playhead.groupIsPlaying

		const canModifyLoop = group.oneAtATime && !group.locked
		const canModifyAutoPlay = group.oneAtATime && !group.locked

		return (
			<div
				ref={wrapperRef}
				className={classNames('group', { disabled: group.disabled, collapsed: group.collapsed })}
				data-drop-handler-id={handlerId}
			>
				<div className="group__header">
					<div
						className={classNames('collapse', { 'collapse--collapsed': group.collapsed })}
						title="Toggle Group collapse"
					>
						<MdChevronRight size={22} onClick={handleCollapse} />
					</div>

					{!editingGroupName && (
						<div
							className="title"
							title={group.locked ? group.name : 'Click to edit'}
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
							>
								<MdStop size={22} />
							</Button>
							<Button variant="contained" size="small" disabled={group.disabled} onClick={handlePlay}>
								{canStop ? <IoPlaySkipBackSharp size={18} /> : <MdPlayArrow size={22} />}
								<div className="playcount">
									{group.oneAtATime ? 1 : group.parts.filter((p) => !p.disabled).length}
								</div>
							</Button>
							<Button
								variant="contained"
								size="small"
								disabled={!canStepDown}
								onClick={handleStepDown}
								sx={{ visibility: group.oneAtATime ? 'visible' : 'hidden' }}
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
							>
								<div style={{ transform: 'rotate(-90deg) translateY(3px)' }}>
									<AiFillStepForward size={22} />
								</div>
							</Button>
						</div>

						<ToggleButton
							title={group.disabled ? 'Enable Group' : 'Disable Group'}
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
							title={group.locked ? 'Unlock Group' : 'Lock Group'}
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
							title={group.oneAtATime ? 'Disable One-at-a-time' : 'Enable One-at-a-time'}
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
							title={group.loop ? 'Disable Loop' : 'Enable Loop'}
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
							title={group.autoPlay ? 'Disable Auto-step' : 'Enable Auto-step'}
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
							title={group.locked ? 'Disabled due to locked Group' : 'Delete Group'}
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
									playhead={playhead}
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
}

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
