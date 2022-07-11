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

export const SideBarEditGroup: React.FC<{
	rundownId: string
	groupId: string
}> = observer(function SideBarEditGroup({ rundownId, groupId }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const group = computed(
		() => (store.rundownsStore.hasGroup(groupId) && store.rundownsStore.getGroup(groupId)) || null
	).get()

	const handleDelete = useCallback(() => {
		ipcServer
			.deleteGroup({
				rundownId,
				groupId,
			})
			.then(() => {
				store.guiStore.removeSelected({
					type: 'group',
					groupId,
				})
			})
			.catch(handleError)
	}, [handleError, ipcServer, rundownId, groupId])

	const header = (
		<>
			<div className="title">
				<span>{`${group?.name}`}</span>
				<div>
					<TrashBtn
						disabled={group?.locked}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title="Delete Group"
					/>
				</div>
			</div>
		</>
	)
	if (!group) return null
	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={group.id} />

			<div className="settings">
				<div className="setting">
					<BooleanInput
						label="Disable playout"
						currentValue={group.disabled}
						disabled={group.locked}
						onChange={(value) => {
							ipcServer
								.toggleGroupDisable({
									rundownId,
									groupId,
									value,
								})
								.catch(handleError)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock group for editing"
						currentValue={group.locked}
						onChange={(value) => {
							ipcServer
								.toggleGroupLock({
									rundownId,
									groupId,
									value,
								})
								.catch(handleError)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Play one Part at a time"
						currentValue={group.oneAtATime}
						disabled={group.locked}
						onChange={(value) => {
							ipcServer
								.toggleGroupOneAtATime({
									rundownId,
									groupId,
									value,
								})
								.catch(handleError)
						}}
					/>
				</div>
				{group.oneAtATime && (
					<div className="setting">
						<BooleanInput
							label="Loop"
							currentValue={group.loop}
							disabled={group.locked}
							onChange={(value) => {
								ipcServer
									.toggleGroupLoop({
										rundownId,
										groupId,
										value,
									})
									.catch(handleError)
							}}
						/>
					</div>
				)}
				{group.oneAtATime && (
					<div className="setting">
						<BooleanInput
							label="Auto-step"
							currentValue={group.autoPlay}
							disabled={group.locked}
							onChange={(value) => {
								ipcServer
									.toggleGroupAutoplay({
										rundownId,
										groupId,
										value,
									})
									.catch(handleError)
							}}
						/>
					</div>
				)}
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Group"
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>Are you sure you want to delete &quot;{group.name}&quot;?</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})
