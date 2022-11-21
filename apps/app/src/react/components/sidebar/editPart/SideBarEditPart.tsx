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
import { DurationInput } from '../../inputs/DurationInput'

type LockState = 'all' | 'some' | 'none'

export const SideBarEditPart: React.FC<{
	rundownId: string
	parts:
		| {
				groupId: string
				partId: string
				groupLocked: boolean
		  }[]
}> = observer(function SideBarEditPart({ rundownId, parts }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const fullParts = computed(() =>
		parts
			.filter((p) => store.rundownsStore.hasPart(p.partId))
			.map((p) => {
				return {
					...p,
					partGUI: store.rundownsStore.getPart(p.partId),
				}
			})
	).get()

	const handleDelete = useCallback(
		(groupId, partId) => {
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
		},
		[handleError, ipcServer, rundownId]
	)

	if (!fullParts.length) return null

	let groupsLocked: LockState = 'none'
	if (fullParts.every((p) => p.groupLocked)) groupsLocked = 'all'
	else if (fullParts.some((p) => p.groupLocked)) groupsLocked = 'some'

	let partsLocked: LockState = 'none'
	if (fullParts.every((p) => p.partGUI.locked)) partsLocked = 'all'
	else if (fullParts.some((p) => p.partGUI.locked)) partsLocked = 'some'

	let durationPlaceholder = 'From content'
	if (fullParts.some((p) => p.partGUI.duration !== fullParts[0].partGUI.duration))
		durationPlaceholder = 'Multiple values'

	const header = (
		<>
			<div className="title">
				<span>{parts.length > 1 ? 'Multiple parts' : `Part: ${fullParts[0].partGUI.resolved.label}`}</span>
				<div>
					<TrashBtn
						disabled={partsLocked === 'all' || groupsLocked === 'all'}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title="Delete Part"
					/>
				</div>
			</div>
		</>
	)

	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={parts.length > 1 ? 'Multiple IDs' : parts[0].partId} />

			<div className="settings">
				<div className="setting">
					<BooleanInput
						label="Disable playout"
						currentValue={fullParts.every((p) => p.partGUI.disabled)}
						indeterminate={fullParts.some((p) => p.partGUI.disabled !== fullParts[0].partGUI.disabled)}
						disabled={partsLocked === 'all' || groupsLocked === 'all'}
						onChange={(value) => {
							fullParts
								.filter((p) => !p.groupLocked && !p.partGUI.locked)
								.forEach((p) =>
									ipcServer
										.updatePart({
											rundownId,
											groupId: p.groupId,
											partId: p.partId,
											part: {
												disabled: value,
											},
										})
										.catch(handleError)
								)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock part for editing"
						currentValue={partsLocked === 'all'}
						indeterminate={partsLocked === 'some'}
						disabled={groupsLocked === 'all'}
						onChange={(value) => {
							fullParts
								.filter((p) => !p.groupLocked)
								.forEach((p) =>
									ipcServer
										.updatePart({
											rundownId,
											groupId: p.groupId,
											partId: p.partId,
											part: {
												locked: value,
											},
										})
										.catch(handleError)
								)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Loop"
						currentValue={fullParts.every((p) => p.partGUI.loop)}
						indeterminate={fullParts.some((p) => p.partGUI.loop !== fullParts[0].partGUI.loop)}
						disabled={partsLocked === 'all' || groupsLocked === 'all'}
						onChange={(value) => {
							fullParts
								.filter((p) => !p.groupLocked && !p.partGUI.locked)
								.forEach((p) =>
									ipcServer
										.updatePart({
											rundownId,
											groupId: p.groupId,
											partId: p.partId,
											part: {
												loop: value,
											},
										})
										.catch(handleError)
								)
						}}
					/>
				</div>
				<div className="setting">
					<DurationInput
						label="Fixed Part duration"
						currentValue={
							fullParts.every((p) => p.partGUI.duration === fullParts[0].partGUI.duration)
								? fullParts[0].partGUI.duration
								: undefined
						}
						disabled={partsLocked === 'all' || groupsLocked === 'all'}
						emptyPlaceholder={durationPlaceholder}
						onChange={(value) => {
							fullParts
								.filter((p) => !p.groupLocked && !p.partGUI.locked)
								.forEach((p) =>
									ipcServer
										.updatePart({
											rundownId,
											groupId: p.groupId,
											partId: p.partId,
											part: {
												duration: value,
											},
										})
										.catch(handleError)
								)
						}}
						allowUndefined={true}
					/>
				</div>
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				acceptLabel="Delete"
				onAccepted={() => {
					fullParts
						.filter((p) => !p.groupLocked && !p.partGUI.locked)
						.forEach((p) => handleDelete(p.groupId, p.partId))
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>
					Are you sure you want to delete{' '}
					{parts.length > 1 ? 'multiple parts' : <>&quot;{parts[0].partId}&quot;</>}?
				</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})
