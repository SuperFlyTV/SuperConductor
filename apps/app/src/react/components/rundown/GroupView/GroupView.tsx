import React, { useEffect, useRef, useState, useContext } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '../../../../models/rundown/Group'
import { MovePartFn, PartView } from './PartView'
import { getGroupPlayhead, GroupPlayhead } from '../../../../lib/playhead'
import { GroupPreparedPlayheadData } from '../../../../models/GUI/PreparedPlayhead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DragItemTypes, PartDragItem } from '../../../api/DragItemTypes'
import { useDrop } from 'react-dnd'
import { getCurrentlyPlayingInfo } from '../../../../lib/util'
import { Mappings } from 'timeline-state-resolver-types'
import { Button, FormControlLabel, Switch } from '@mui/material'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { GroupPropertiesDialog } from '../GroupPropertiesDialog'

export const GroupView: React.FC<{
	rundownId: string
	group: Group
	groupIndex: number
	mappings: Mappings
	movePart: MovePartFn
}> = ({ group, groupIndex, rundownId, mappings, movePart }) => {
	const ipcServer = useContext(IPCServerContext)

	const [groupPropsOpen, setGroupPropsOpen] = useState(false)

	const playheadData = useRef<GroupPreparedPlayheadData | null>(null)
	const [_activeParts, setActiveParts] = useState<{ [partId: string]: true }>({})
	useEffect(() => {
		playheadData.current = group.playheadData

		const activeParts0: { [partId: string]: true } = {}

		if (group.playheadData) {
			for (const part of group.playheadData.parts) {
				activeParts0[part.part.id] = true
			}
			if (group.playheadData.repeating) {
				for (const part of group.playheadData.repeating.parts) {
					activeParts0[part.part.id] = true
				}
			}
		}
		setActiveParts(activeParts0)
	}, [group])

	const [playhead, setPlayhead] = useState<GroupPlayhead | null>(null)
	const requestRef = useRef<number>(0)
	const updatePlayhead = () => {
		setPlayhead(getGroupPlayhead(playheadData.current))
		requestRef.current = window.requestAnimationFrame(updatePlayhead)
	}
	useEffect(() => {
		requestRef.current = window.requestAnimationFrame(updatePlayhead)
		return () => {
			window.cancelAnimationFrame(requestRef.current)
		}
	}, [])

	/** Whether we're allowed to stop playing */
	const wasPlayingRef = useRef(false)
	const stopPlayingRef = useRef(true)
	useEffect(() => {
		if (group.playheadData && wasPlayingRef.current && (!playhead || !playhead.partId)) {
			// We believe that we are are playing, but the playhead says otherwise.
			// That probably means that we have reached the end.

			if (stopPlayingRef.current) {
				// Stop the group, so that the "stop"-buttons reflect the correct state.
				console.log('Auto-stopping group', group.id)

				ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(console.error)
				stopPlayingRef.current = false
			}
		} else {
			stopPlayingRef.current = true
		}

		// We are definitely playing
		if (group.playheadData && playhead) {
			wasPlayingRef.current = true
		} else {
			wasPlayingRef.current = false
		}
	}, [playhead])

	const isGroupPlaying = !!playhead
	const wrapperRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop(
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			canDrop: (item: PartDragItem) => {
				// Don't allow dropping into a transparent group.
				if (group.transparent) {
					return false
				}

				// Don't allow dropping a currently-playing Part onto a Group which is currently playing
				const { partPlayheadData: fromGroupPartPlayheadData } = getCurrentlyPlayingInfo(item.group)
				const movedPartIsPlaying = Boolean(
					fromGroupPartPlayheadData && fromGroupPartPlayheadData.part.id === item.part.id
				)
				const isMovingToNewGroup = item.group.id !== group.id
				if (movedPartIsPlaying && isMovingToNewGroup && isGroupPlaying) {
					return false
				}

				return true
			},
			async hover(item: PartDragItem) {
				// Don't use the GroupView as a drop target when there are Parts present.
				if (group.parts.length > 0) {
					return
				}

				// Don't allow dropping a currently-playing Part onto a Group which is currently playing
				const { partPlayheadData: fromGroupPartPlayheadData } = getCurrentlyPlayingInfo(item.group)
				const movedPartIsPlaying = Boolean(
					fromGroupPartPlayheadData && fromGroupPartPlayheadData.part.id === item.part.id
				)
				const isMovingToNewGroup = item.group.id !== group.id
				if (movedPartIsPlaying && isMovingToNewGroup && isGroupPlaying) {
					return
				}

				const dragGroup = item.group
				const dragPart = item.part
				const dragIndex = item.index
				const hoverIndex = 0
				const hoverGroup = group

				// Don't allow dragging into transparent groups, which can only have one part.
				if (hoverGroup.transparent) {
					return
				}

				// Don't replace items with themselves
				if (dragGroup.id === hoverGroup.id && dragIndex === hoverIndex) {
					return
				}

				// Time to actually perform the action
				const newGroup = await movePart({ dragGroup, dragPart, hoverGroup, hoverIndex })
				if (!newGroup) {
					// The backend rejected the move, so do nothing.
					return
				}

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				item.index = hoverIndex
				item.group = newGroup
			},
		},
		[group]
	)
	drop(wrapperRef)

	if (group.transparent) {
		const firstPart = group.parts[0]
		return firstPart ? (
			<div ref={wrapperRef} data-handler-id={handlerId}>
				<PartView
					rundownId={rundownId}
					part={firstPart}
					parentGroup={group}
					parentGroupIndex={groupIndex}
					playhead={playhead}
					mappings={mappings}
					movePart={movePart}
				/>
			</div>
		) : null
	} else {
		return (
			<div ref={wrapperRef} className="group" data-handler-id={handlerId}>
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
										checked={group.autoPlay}
										onChange={() => {
											ipcServer
												.toggleGroupAutoplay({
													rundownId,
													groupId: group.id,
													value: !group.autoPlay,
												})
												.catch(console.error)
										}}
									/>
								}
								label="Auto-play"
							/>
						</div>

						<div className="toggle">
							<FormControlLabel
								control={
									<Switch
										checked={group.loop}
										onChange={() => {
											ipcServer
												.toggleGroupLoop({ rundownId, groupId: group.id, value: !group.loop })
												.catch(console.error)
										}}
									/>
								}
								label="Loop"
							/>
						</div>
						<TrashBtn
							onClick={() => {
								ipcServer.deleteGroup({ rundownId, groupId: group.id }).catch(console.error)
							}}
						/>
					</div>
				</div>
				<div className="group__content">
					{group.parts.map((part) => (
						<PartView
							key={part.id}
							rundownId={rundownId}
							part={part}
							parentGroup={group}
							parentGroupIndex={groupIndex}
							playhead={playhead}
							mappings={mappings}
							movePart={movePart}
						/>
					))}

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
							.catch(console.error)
						setGroupPropsOpen(false)
					}}
					onDiscarded={() => {
						setGroupPropsOpen(false)
					}}
				/>
			</div>
		)
	}
}

const GroupOptions: React.FC<{ rundownId: string; group: Group }> = ({ rundownId, group }) => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = React.useState(false)

	return (
		<>
			<div className="group-list__control-row">
				<Button className="btn" variant="contained" onClick={() => setNewPartOpen(true)}>
					New part
				</Button>
			</div>

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
						.catch(console.error)
					setNewPartOpen(false)
				}}
				onDiscarded={() => {
					setNewPartOpen(false)
				}}
			/>
		</>
	)
}
