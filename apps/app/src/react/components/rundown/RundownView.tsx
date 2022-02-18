import React, { useContext, useEffect, useRef, useState } from 'react'
import { GroupView } from './GroupView/GroupView'
import { RundownContext } from '../../contexts/Rundown'
import { IPCServerContext } from '../../contexts/IPCServer'
import { Rundown } from '../../../models/rundown/Rundown'
import { useDrop } from 'react-dnd'
import { DragItemTypes, isPartDragItem } from '../../api/DragItemTypes'
import { Mappings } from 'timeline-state-resolver-types'
import { Button } from '@mui/material'
import { PartPropertiesDialog } from './PartPropertiesDialog'
import { GroupPropertiesDialog } from './GroupPropertiesDialog'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { PartMoveContext } from '../../contexts/PartMove'

export const RundownView: React.FC<{ mappings: Mappings }> = ({ mappings }) => {
	const rundown = useContext(RundownContext)
	const { updatePartMove } = useContext(PartMoveContext)
	const updatePartMoveRef = useRef(updatePartMove)
	updatePartMoveRef.current = updatePartMove

	// Drag n' Drop:
	const wrapperRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop(
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			hover(movedItem, monitor) {
				if (!isPartDragItem(movedItem)) {
					return
				}

				const hoverIndex = rundown.groups.length

				// Don't replace items with themselves
				if (movedItem.fromGroup.transparent) {
					return
				}

				// Ignore nested hover targets
				if (!monitor.isOver({ shallow: true })) {
					return
				}

				// Time to actually perform the action
				updatePartMoveRef.current({
					partId: movedItem.partId,
					fromGroupId: movedItem.fromGroup.id,
					toGroupId: null,
					position: hoverIndex,
				})

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				movedItem.toGroupId = null
				movedItem.toGroupIndex = hoverIndex
				movedItem.toGroupTransparent = true
				movedItem.position = hoverIndex
			},
		},
		[rundown.groups]
	)

	useEffect(() => {
		drop(wrapperRef)
	}, [drop])

	return (
		<div className="group-list" ref={wrapperRef} data-drop-handler-id={handlerId}>
			{rundown.groups.map((group, index) => {
				return (
					<GroupView
						key={group.id}
						group={group}
						groupIndex={index}
						rundownId={rundown.id}
						mappings={mappings}
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
