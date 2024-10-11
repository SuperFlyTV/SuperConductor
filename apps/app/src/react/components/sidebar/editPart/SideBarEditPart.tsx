import { IPCServerContext } from '../../../contexts/IPCServer.js'
import React, { useCallback, useContext, useState } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn.js'
import { DataRow } from '../DataRow/DataRow.js'
import { SidebarContent } from '../SidebarContent.js'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler.js'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store.js'
import { ConfirmationDialog } from '../../util/ConfirmationDialog.js'
import { computed } from 'mobx'
import { BooleanInput } from '../../inputs/BooleanInput.js'
import { DurationInput } from '../../inputs/DurationInput.js'
import { getListBoolean, ListBoolean, inputValue } from '../../../lib/multipleEdit.js'

export const SideBarEditPart: React.FC<{
	rundownId: string
	parts: {
		groupId: string
		partId: string
		groupLocked: boolean
	}[]
}> = observer(function SideBarEditPart({ rundownId, parts }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	/**
	 * A list of all selected parts.
	 * Guaranteed to have at least 1 entry
	 */
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
		(groupId: string, partId: string) => {
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

	if (!fullParts.length) return null // Ensure at least one entry

	const groupsLocked = getListBoolean(fullParts, (p) => p.groupLocked ?? false)
	const partsLocked = getListBoolean(fullParts, (p) => p.partGUI.locked ?? false)

	let durationPlaceholder = 'From content'
	if (fullParts.some((p) => p.partGUI.duration !== fullParts[0].partGUI.duration))
		durationPlaceholder = '-- Different values --'

	const modifiableParts = fullParts.filter((p) => !p.groupLocked && !p.partGUI.locked)

	const header = (
		<>
			<div className="title">
				<span>
					{fullParts.length > 1
						? `${fullParts.length} parts`
						: `Part: ${fullParts[0].partGUI.resolved.label}`}
				</span>
				<div>
					<TrashBtn
						disabled={modifiableParts.length === 0}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title={modifiableParts.length === 1 ? 'Delete Part' : `Delete ${modifiableParts.length} Parts`}
					/>
				</div>
			</div>
		</>
	)

	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={fullParts.length > 1 ? 'Different IDs' : fullParts[0].partId} />

			<div className="settings">
				<div className="setting">
					<BooleanInput
						label="Disable playout"
						{...inputValue(modifiableParts, (p) => p.partGUI.disabled, undefined)}
						disabled={partsLocked === ListBoolean.ALL || groupsLocked === ListBoolean.ALL}
						onChange={(value) => {
							modifiableParts.forEach((p) => {
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
							})
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock part for editing"
						currentValue={partsLocked === ListBoolean.ALL}
						indeterminate={partsLocked === ListBoolean.SOME}
						disabled={groupsLocked === ListBoolean.ALL}
						onChange={(value) => {
							fullParts
								.filter((p) => !p.groupLocked)
								.forEach((p) => {
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
								})
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Loop"
						{...inputValue(modifiableParts, (p) => p.partGUI.loop, undefined)}
						disabled={partsLocked === ListBoolean.ALL || groupsLocked === ListBoolean.ALL}
						onChange={(value) => {
							modifiableParts.forEach((p) => {
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
							})
						}}
					/>
				</div>
				<div className="setting">
					<DurationInput
						label="Fixed Part duration"
						{...inputValue(modifiableParts, (p) => p.partGUI.duration, undefined)}
						disabled={partsLocked === ListBoolean.ALL || groupsLocked === ListBoolean.ALL}
						emptyPlaceholder={durationPlaceholder}
						onChange={(value) => {
							modifiableParts.forEach((p) => {
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
							})
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
					// fullParts
					modifiableParts.forEach((p) => handleDelete(p.groupId, p.partId))
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>
					Are you sure you want to delete{' '}
					{modifiableParts.length > 1 || modifiableParts.length === 0 ? (
						`${modifiableParts.length} parts`
					) : (
						<>&quot;{modifiableParts[0].partGUI.resolved.label}&quot;</>
					)}
					?
				</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})
