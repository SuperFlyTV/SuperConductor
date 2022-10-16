import React, { useContext, useEffect, useRef, useState } from 'react'
import { GroupView } from './GroupView/GroupView'
import { IPCServerContext } from '../../contexts/IPCServer'
import { useDrop } from 'react-dnd'
import { DragItemTypes, isPartDragItem, isResourceDragItem } from '../../api/DragItemTypes'
import { Mappings } from 'timeline-state-resolver-types'
import { PartPropertiesDialog } from './PartPropertiesDialog'
import { GroupPropertiesDialog } from './GroupPropertiesDialog'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { DropZone } from '../util/DropZone'
import { observer } from 'mobx-react-lite'
import { store } from '../../mobx/store'
import { useMemoComputedObject } from '../../mobx/lib'
import { Btn } from '../inputs/Btn/Btn'
import { getClassNameFromResource } from '../../../lib/resources'
import { MoveTarget } from '../../../lib/util'
import { ErrorBoundary } from '../util/ErrorBoundary'

export const RundownView: React.FC<{ mappings: Mappings }> = observer(function RundownView({ mappings }) {
	// Drag n' Drop:
	const wrapperRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop(
		// Use case: Drag Parts over this Rundown to insert them as transparent Group-Parts in this Rundown
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			hover(movedItem, monitor) {
				const currentRundownId = store.rundownsStore.currentRundownId
				if (!currentRundownId) return

				if (!isPartDragItem(movedItem)) return

				// Handle when dragging a Part outside of a Group, to create a new transparent Group
				// const hoverIndex = currentRundown.groupIds.length

				if (movedItem.parts.find((p) => p.fromGroup.transparent)) {
					return
				}

				// Ignore nested hover targets
				if (!monitor.isOver({ shallow: true })) {
					return
				}

				const target: MoveTarget = {
					type: 'last',
				}

				// Time to actually perform the action
				// store.rundownsStore.movePartInCurrentRundown(movedItem.partId, null, hoverIndex)
				store.rundownsStore.movePartsInCurrentRundown(
					movedItem.parts.map((p) => p.partId),
					null,
					target
				)

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				movedItem.toGroupId = null
				movedItem.target = target
			},
		},
		[store.rundownsStore]
	)

	useEffect(() => {
		drop(wrapperRef)
	}, [drop])

	const currentRundown = useMemoComputedObject(() => {
		const currentRundownId = store.rundownsStore.currentRundownId
		if (!currentRundownId) return undefined
		if (!store.rundownsStore.hasRundown(currentRundownId)) return undefined

		return store.rundownsStore.getRundown(currentRundownId)
	}, [])

	if (!currentRundown) return null

	return (
		<div className="group-list" ref={wrapperRef} data-drop-handler-id={handlerId}>
			{currentRundown.groupIds.map((groupId) => {
				return (
					<ErrorBoundary key={groupId}>
						<GroupView groupId={groupId} rundownId={currentRundown.id} mappings={mappings} />
					</ErrorBoundary>
				)
			})}

			<ErrorBoundary>
				<GroupListOptions rundownId={currentRundown.id} />
			</ErrorBoundary>
		</div>
	)
})

const GroupListOptions: React.FC<{ rundownId: string }> = observer(function GroupListOptions({ rundownId }) {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)
	const { handleError } = useContext(ErrorHandlerContext)
	const { partCount, groupCount } = useMemoComputedObject(() => {
		if (!store.rundownsStore.hasRundown(rundownId)) return { partCount: 0, groupCount: 0 }
		const rundown = store.rundownsStore.getRundownWithGroups(rundownId)
		return {
			partCount:
				rundown.groups.reduce((prev, current) => {
					return prev + current.partIds.length
				}, 0) ?? 0,
			groupCount: rundown.groups.length ?? 0,
		}
	}, [store])
	const newPartRef = useRef<HTMLDivElement>(null)
	const newGroupRef = useRef<HTMLDivElement>(null)

	const [{ handlerId: partDropHandlerId, isOver: partDropIsOver }, newPartDrop] = useDrop(
		// Use case: Drag Resources over this area, to insert them as transparent Group-Parts in the Rundown
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
						const { partId, groupId } = await ipcServer.newPart({
							rundownId,
							groupId: null, // Creates a transparent group.
							name: '', // resource.displayName,
						})

						if (!groupId) {
							return
						}

						await ipcServer.addResourcesToTimeline({
							rundownId,
							groupId,
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
		[rundownId]
	)
	useEffect(() => {
		newPartDrop(newPartRef)
	}, [newPartDrop])

	const [{ handlerId: groupDropHandlerId, isOver: groupDropIsOver }, newGroupDrop] = useDrop(
		// Use case: Drag Resources over this area, to insert them as a Group with Parts in the Rundown
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

					// If all of the dropped items are of the same type, we can give the group a nice name:
					let firstGroupName = ''
					let useFirstGroupName = true
					for (const resource of droppedItem.resources) {
						const name = getClassNameFromResource(resource)
						if (!firstGroupName) {
							firstGroupName = name
						} else if (firstGroupName !== name) {
							useFirstGroupName = false
							break
						}
					}
					const groupName = useFirstGroupName ? firstGroupName : 'New Group'

					const groupId = await ipcServer.newGroup({
						rundownId,
						name: groupName,
					})
					for (const resource of droppedItem.resources) {
						const { partId } = await ipcServer.newPart({
							rundownId,
							groupId,
							name: '', // resource.displayName,
						})

						await ipcServer.addResourcesToTimeline({
							rundownId,
							groupId,
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
		[rundownId]
	)
	useEffect(() => {
		newGroupDrop(newGroupRef)
	}, [newGroupDrop])

	return (
		<>
			<div className="group-list__control-row last-in-rundown">
				<DropZone
					isOver={partDropIsOver}
					ref={newPartRef}
					// style={{ height: '96vh' }}
					data-drop-handler-id={partDropHandlerId}
				>
					<Btn variant="contained" onClick={() => setNewPartOpen(true)}>
						New part
					</Btn>
				</DropZone>
				<DropZone
					isOver={groupDropIsOver}
					ref={newGroupRef}
					// style={{ flexGrow: 1, height: '96vh' }}
					style={{ flexGrow: 1 }}
					data-drop-handler-id={groupDropHandlerId}
				>
					<Btn variant="contained" onClick={() => setNewGroupOpen(true)}>
						New group
					</Btn>
				</DropZone>
			</div>

			<PartPropertiesDialog
				open={newPartOpen}
				title="New Part"
				acceptLabel="Create"
				initial={{ name: `Part ${partCount + 1}` }}
				onAccepted={(newPart) => {
					ipcServer
						.newPart({
							rundownId,
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
				initial={{ name: `Group ${groupCount + 1}` }}
				onAccepted={(newGroup) => {
					ipcServer
						.newGroup({
							rundownId,
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
})
