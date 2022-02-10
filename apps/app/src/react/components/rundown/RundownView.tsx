import React, { useCallback, useContext, useRef, useState } from 'react'
import { GroupView } from './GroupView/GroupView'
import { RundownContext } from '../../contexts/Rundown'
import { IPCServerContext } from '../../contexts/IPCServer'
import { Rundown } from '../../../models/rundown/Rundown'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { DragItemTypes, PartDragItem } from '../../api/DragItemTypes'
import { MovePartFn } from './GroupView/PartView'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { Mappings } from 'timeline-state-resolver-types'
import { Button } from '@mui/material'
import { PartPropertiesDialog } from './PartPropertiesDialog'
import { GroupPropertiesDialog } from './GroupPropertiesDialog'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'

export const RundownView: React.FC<{ mappings: Mappings }> = ({ mappings }) => {
	const rundown = useContext(RundownContext)
	const ipcServer = useContext(IPCServerContext)

	// Drag n' Drop:
	const wrapperRef = useRef<HTMLDivElement>(null)
	const movePart: MovePartFn = useCallback(
		(data: { dragGroup: Group; dragPart: Part; hoverGroup: Group | null; hoverIndex: number }) => {
			return ipcServer.movePart({
				from: {
					rundownId: rundown.id,
					groupId: data.dragGroup.id,
					partId: data.dragPart.id,
				},
				to: {
					rundownId: rundown.id,
					groupId: data.hoverGroup?.id ?? null,
					position: data.hoverIndex,
				},
			})
		},
		[rundown.id]
	)
	const [{ handlerId }, drop] = useDrop(
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			async hover(item: PartDragItem, monitor: DropTargetMonitor) {
				const dragGroup = item.group
				const dragPart = item.part
				const hoverIndex = rundown.groups.length
				const hoverGroup = null

				// Don't replace items with themselves
				if (dragGroup.transparent) {
					return
				}

				// Ignore nested hover targets
				if (!monitor.isOver({ shallow: true })) {
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
		[rundown.groups]
	)
	drop(wrapperRef)

	return (
		<div className="group-list" ref={wrapperRef} data-handler-id={handlerId}>
			{rundown.groups.map((group, index) => {
				return (
					<GroupView
						key={group.id}
						group={group}
						groupIndex={index}
						rundownId={rundown.id}
						mappings={mappings}
						movePart={movePart}
					/>
				)
			})}

			<GroupListOptions rundown={rundown} />
		</div>
	)
}

const GroupListOptions: React.FC<{ rundown: Rundown }> = ({ rundown }) => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)
	const { handleError } = useContext(ErrorHandlerContext)

	return (
		<>
			<div className="group-list__control-row">
				<Button className="btn" variant="contained" onClick={() => setNewPartOpen(true)}>
					New part
				</Button>
				<Button className="btn" variant="contained" onClick={() => setNewGroupOpen(true)}>
					New group
				</Button>
			</div>

			<PartPropertiesDialog
				open={newPartOpen}
				title="New Part"
				acceptLabel="Create"
				onAccepted={(newPart) => {
					ipcServer
						.newPart({
							rundownId: rundown.id,
							name: newPart.name,
							groupId: null,
						})
						.catch(handleError)
					setNewPartOpen(false)
				}}
				onDiscarded={() => {
					setNewPartOpen(false)
				}}
			/>

			<GroupPropertiesDialog
				open={newGroupOpen}
				title="New Group"
				acceptLabel="Create"
				onAccepted={(newGroup) => {
					ipcServer
						.newGroup({
							rundownId: rundown.id,
							name: newGroup.name,
						})
						.catch(handleError)
					setNewGroupOpen(false)
				}}
				onDiscarded={() => {
					setNewGroupOpen(false)
				}}
			/>
		</>
	)
}
