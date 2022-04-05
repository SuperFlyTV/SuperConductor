import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { GroupView } from './GroupView/GroupView'
import { RundownContext } from '../../contexts/Rundown'
import { IPCServerContext } from '../../contexts/IPCServer'
import { Rundown } from '../../../models/rundown/Rundown'
import { useDrop } from 'react-dnd'
import { DragItemTypes, isPartDragItem, isResourceDragItem } from '../../api/DragItemTypes'
import { Mappings } from 'timeline-state-resolver-types'
import { Button } from '@mui/material'
import { PartPropertiesDialog } from './PartPropertiesDialog'
import { GroupPropertiesDialog } from './GroupPropertiesDialog'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { DropZone } from '../util/DropZone'
import { observer } from 'mobx-react-lite'
import { store } from '../../mobx/store'

export const RundownView: React.FC<{ mappings: Mappings }> = observer(function RundownView({ mappings }) {
	const rundown = useContext(RundownContext)

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
				store.guiStore.updatePartMove({
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
})

const GroupListOptions: React.FC<{ rundown: Rundown }> = ({ rundown }) => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)
	const { handleError } = useContext(ErrorHandlerContext)
	const numParts = useMemo(() => {
		return rundown.groups.reduce((prev, current) => {
			return prev + current.parts.length
		}, 0)
	}, [rundown])
	const newPartRef = useRef<HTMLDivElement>(null)
	const newGroupRef = useRef<HTMLDivElement>(null)

	const [{ handlerId: partDropHandlerId, isOver: partDropIsOver }, newPartDrop] = useDrop(
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

					const { partId, groupId } = await ipcServer.newPart({
						rundownId: rundown.id,
						groupId: null, // Creates a transparent group.
						name: droppedItem.resource.id,
					})

					if (!groupId) {
						return
					}

					await ipcServer.addResourceToTimeline({
						rundownId: rundown.id,
						groupId,
						partId,
						layerId: null,
						resourceId: droppedItem.resource.id,
					})
				} catch (error) {
					handleError(error)
				}
			},
		},
		[rundown]
	)
	useEffect(() => {
		newPartDrop(newPartRef)
	}, [newPartDrop])

	const [{ handlerId: groupDropHandlerId, isOver: groupDropIsOver }, newGroupDrop] = useDrop(
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

					const groupAndPartName =
						'name' in droppedItem.resource ? (droppedItem.resource as any).name : droppedItem.resource.id

					const groupId = await ipcServer.newGroup({
						rundownId: rundown.id,
						name: groupAndPartName,
					})

					const { partId } = await ipcServer.newPart({
						rundownId: rundown.id,
						groupId,
						name: groupAndPartName,
					})

					await ipcServer.addResourceToTimeline({
						rundownId: rundown.id,
						groupId,
						partId,
						layerId: null,
						resourceId: droppedItem.resource.id,
					})
				} catch (error) {
					handleError(error)
				}
			},
		},
		[rundown]
	)
	useEffect(() => {
		newGroupDrop(newGroupRef)
	}, [newGroupDrop])

	return (
		<>
			<div className="group-list__control-row">
				<DropZone
					isOver={partDropIsOver}
					ref={newPartRef}
					// style={{ height: '96vh' }}
					data-drop-handler-id={partDropHandlerId}
				>
					<Button variant="contained" onClick={() => setNewPartOpen(true)}>
						New part
					</Button>
				</DropZone>
				<DropZone
					isOver={groupDropIsOver}
					ref={newGroupRef}
					// style={{ flexGrow: 1, height: '96vh' }}
					style={{ flexGrow: 1 }}
					data-drop-handler-id={groupDropHandlerId}
				>
					<Button variant="contained" onClick={() => setNewGroupOpen(true)}>
						New group
					</Button>
				</DropZone>
			</div>

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
				initial={{ name: `Group ${rundown.groups.length + 1}` }}
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
