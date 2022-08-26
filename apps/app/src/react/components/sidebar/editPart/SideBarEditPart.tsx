import { IPCServerContext } from '../../../contexts/IPCServer'
import React, { useCallback, useContext, useState } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn'
import { DataRow } from '../DataRow/DataRow'
import { SidebarContent } from '../SidebarContent'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'
import { computed } from 'mobx'
import { BooleanInput } from '../../inputs/BooleanInput'

export const SideBarEditPart: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	groupLocked: boolean
}> = observer(function SideBarEditPart({ rundownId, groupId, partId, groupLocked }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const part = computed(
		() => (store.rundownsStore.hasPart(partId) && store.rundownsStore.getPart(partId)) || null
	).get()

	const handleDelete = useCallback(() => {
		ipcServer
			.deletePart({
				rundownId,
				groupId,
				partId,
			})
			.then(() => {
				store.guiStore.removeSelected({
					type: 'part',
					groupId,
					partId,
				})
			})
			.catch(handleError)
	}, [handleError, ipcServer, rundownId, groupId, partId])

	if (!part) return null

	const groupOrPartLocked = groupLocked || part.locked

	const header = (
		<>
			<div className="title">
				<span>{`${part.name}`}</span>
				<div>
					<TrashBtn
						disabled={part?.locked}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title="Delete Group"
					/>
				</div>
			</div>
		</>
	)

	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={part.id} />

			<div className="settings">
				<div className="setting">
					<BooleanInput
						label="Disable playout"
						currentValue={part.disabled}
						disabled={groupOrPartLocked}
						onChange={(value) => {
							ipcServer
								.updatePart({
									rundownId,
									groupId,
									partId,
									part: {
										disabled: value,
									},
								})
								.catch(handleError)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock group for editing"
						currentValue={part.locked}
						disabled={groupLocked}
						onChange={(value) => {
							ipcServer
								.updatePart({
									rundownId,
									groupId,
									partId,
									part: {
										locked: value,
									},
								})
								.catch(handleError)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Loop"
						currentValue={part.loop}
						disabled={groupOrPartLocked}
						onChange={(value) => {
							ipcServer
								.updatePart({
									rundownId,
									groupId,
									partId,
									part: {
										loop: value,
									},
								})
								.catch(handleError)
						}}
					/>
				</div>
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>Are you sure you want to delete &quot;{part.name}&quot;?</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})
