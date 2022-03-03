import React, { useEffect, useRef, useState, useContext, useCallback } from 'react'
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
import { Button, FormControlLabel, Switch } from '@mui/material'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { GroupPropertiesDialog } from '../GroupPropertiesDialog'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { assertNever } from '@shared/lib'
import { allowMovingItemIntoGroup } from '../../../../lib/util'
import { PartMoveContext } from '../../../contexts/PartMove'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { DropZone } from '../../util/DropZone'

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
	const [groupPropsOpen, setGroupPropsOpen] = useState(false)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const updatePartMoveRef = useRef(updatePartMove)
	updatePartMoveRef.current = updatePartMove

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
		const canModifyOneAtATime = !(!group.oneAtATime && playhead.anyPartIsPlaying)
		// (group.oneAtATime && playhead.anyPartIsPlaying) || !group.oneAtATime
		// || !group.oneAtATime // && !playhead.groupIsPlaying

		const canModifyLoop = group.oneAtATime
		const canModifyAutoPlay = group.oneAtATime

		return (
			<div ref={wrapperRef} className="group" data-drop-handler-id={handlerId}>
				<div className="group__header">
					<div
						className="title"
						onDoubleClick={() => {
							setGroupPropsOpen(true)
						}}
					>
						{group.name}
					</div>
					<div className="controls">
						<div className="toggle">
							<FormControlLabel
								control={
									<Switch
										checked={group.oneAtATime && group.autoPlay}
										onChange={() => {
											ipcServer
												.toggleGroupAutoplay({
													rundownId,
													groupId: group.id,
													value: !group.autoPlay,
												})
												.catch(handleError)
										}}
									/>
								}
								label="Auto-step"
								labelPlacement="start"
								disabled={!canModifyAutoPlay}
							/>
						</div>

						<div className="toggle">
							<FormControlLabel
								control={
									<Switch
										checked={group.oneAtATime && group.loop}
										onChange={() => {
											ipcServer
												.toggleGroupLoop({ rundownId, groupId: group.id, value: !group.loop })
												.catch(handleError)
										}}
									/>
								}
								label="Loop"
								labelPlacement="start"
								disabled={!canModifyLoop}
							/>
						</div>
						<div className="toggle">
							<FormControlLabel
								control={
									<Switch
										checked={group.oneAtATime}
										onChange={() => {
											ipcServer
												.toggleGroupOneAtATime({
													rundownId,
													groupId: group.id,
													value: !group.oneAtATime,
												})
												.catch(console.error)
										}}
									/>
								}
								label="One-at-a-time"
								labelPlacement="start"
								disabled={!canModifyOneAtATime}
							/>
						</div>
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
					</div>
				</div>
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

					<GroupOptions rundownId={rundownId} group={group} />
				</div>

				<GroupPropertiesDialog
					initial={group}
					open={groupPropsOpen}
					title="Edit Group"
					acceptLabel="Save"
					onAccepted={(updatedGroup) => {
						ipcServer
							.updateGroup({
								rundownId,
								groupId: group.id,
								group: {
									...group,
									name: updatedGroup.name,
								},
							})
							.catch(handleError)
						setGroupPropsOpen(false)
					}}
					onDiscarded={() => {
						setGroupPropsOpen(false)
					}}
				/>

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

const GroupOptions: React.FC<{ rundownId: string; group: Group }> = ({ rundownId, group }) => {
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
						rundownId,
						groupId: group.id,
						name: droppedItem.resource.id,
					})

					await ipcServer.addResourceToTimeline({
						rundownId,
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
		[rundownId, group]
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
				onAccepted={(newPart) => {
					ipcServer
						.newPart({
							rundownId,
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
