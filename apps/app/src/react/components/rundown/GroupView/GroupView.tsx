import React, { useEffect, useRef, useState, useContext } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '../../../../models/rundown/Group'
import { MovePartFn, PartView } from './PartView'
import { getGroupPlayData, GroupPlayData } from '../../../../lib/playhead'
import { GroupPreparedPlayData } from '../../../../models/GUI/PreparedPlayhead'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DragItemTypes, PartDragItem } from '../../../api/DragItemTypes'
import { useDrop } from 'react-dnd'
import { Mappings } from 'timeline-state-resolver-types'
import { Button, FormControlLabel, Switch } from '@mui/material'
import { PartPropertiesDialog } from '../PartPropertiesDialog'
import { GroupPropertiesDialog } from '../GroupPropertiesDialog'
import _ from 'lodash'
import { assertNever } from '@shared/lib'
import { allowMovingItemIntoGroup } from '../../../../lib/util'

export const GroupView: React.FC<{
	rundownId: string
	group: Group
	groupIndex: number
	mappings: Mappings
	movePart: MovePartFn
}> = ({ group, groupIndex, rundownId, mappings, movePart }) => {
	const ipcServer = useContext(IPCServerContext)

	const [groupPropsOpen, setGroupPropsOpen] = useState(false)

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
	const updatePlayhead = () => {
		const newPlayhead = getGroupPlayData(playheadData.current)
		// console.log('playhead', newPlayhead)
		setPlayhead(newPlayhead)
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
		if (group.preparedPlayData && wasPlayingRef.current && !group.oneAtATime && !playhead.groupIsPlaying) {
			// We believe that we are are playing, but the playhead says otherwise.
			// That probably means that we have reached the end.

			if (stopPlayingRef.current) {
				// Stop the group, so that the "stop"-buttons reflect the correct state:
				console.log('Auto-stopping group', group.id)

				ipcServer.stopGroup({ rundownId, groupId: group.id }).catch(console.error)
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
	}, [playhead, group, ipcServer, rundownId])

	const wrapperRef = useRef<HTMLDivElement>(null)

	const [{ handlerId }, drop] = useDrop(
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			canDrop: (movedItem: PartDragItem) => {
				return !!allowMovingItemIntoGroup(movedItem.part.id, movedItem.group, group)
			},
			async hover(movedItem: PartDragItem) {
				// Don't use the GroupView as a drop target when there are Parts present.
				if (group.parts.length > 0) {
					return
				}

				if (!allowMovingItemIntoGroup(movedItem.part.id, movedItem.group, group)) {
					return
				}

				const dragGroup = movedItem.group
				const dragPart = movedItem.part
				const dragIndex = movedItem.index
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
				movedItem.index = hoverIndex
				movedItem.group = newGroup
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
		const canModifyOneAtATime = !(!group.oneAtATime && playhead.anyPartIsPlaying)
		// (group.oneAtATime && playhead.anyPartIsPlaying) || !group.oneAtATime
		// || !group.oneAtATime // && !playhead.groupIsPlaying

		const canModifyLoop = group.oneAtATime
		const canModifyAutoPlay = group.oneAtATime

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
										checked={group.oneAtATime && group.autoPlay}
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
												.catch(console.error)
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
