import { Button } from '@mui/material'
import React, { useCallback, useContext, useState } from 'react'
import { MdOutlineEditNote } from 'react-icons/md'
import { PartGUI } from '../../../../models/rundown/Part'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import sorensen from '@sofie-automation/sorensen'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { DuplicateBtn } from '../../inputs/DuplicateBtn'
import { TrashBtn } from '../../inputs/TrashBtn'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'
import { PartPropertiesDialog } from '../PartPropertiesDialog'

export const PartSubmenu: React.FC<{
	rundownId: string
	groupId: string
	part: PartGUI
	locked?: boolean
}> = ({ rundownId, groupId, part, locked }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const [partPropertiesDialogOpen, setPartPropertiesDialogOpen] = useState(false)

	const handleDelete = useCallback(() => {
		ipcServer.deletePart({ rundownId, groupId, partId: part.id }).catch(handleError)
	}, [groupId, handleError, ipcServer, part.id, rundownId])

	const handleDuplicateBtn = useCallback(() => {
		ipcServer
			.duplicatePart({
				rundownId,
				groupId,
				partId: part.id,
			})
			.catch(handleError)
	}, [groupId, handleError, ipcServer, part.id, rundownId])

	return (
		<div className="part__submenu">
			<div className="controls">
				<Button
					variant="contained"
					size="small"
					title={'Edit Part Name' + (locked ? ' (disabled due to locked Part or Group)' : '')}
					disabled={locked}
					onClick={() => {
						setPartPropertiesDialogOpen(true)
					}}
				>
					<MdOutlineEditNote size={18} />
				</Button>

				<DuplicateBtn title="Duplicate Part" onClick={handleDuplicateBtn} />

				<TrashBtn
					disabled={locked}
					title={'Delete Part' + (locked ? ' (disabled due to locked Part or Group)' : '')}
					onClick={() => {
						const pressedKeys = sorensen.getPressedKeys()
						if (pressedKeys.includes('ControlLeft') || pressedKeys.includes('ControlRight')) {
							// Delete immediately with no confirmation dialog.
							handleDelete()
						} else {
							setDeleteConfirmationOpen(true)
						}
					}}
				/>
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				body={`Are you sure you want to delete the part "${part.name}"?`}
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			/>

			<PartPropertiesDialog
				open={partPropertiesDialogOpen}
				title="Edit Part"
				acceptLabel="Save"
				initial={{ name: part.name }}
				onAccepted={({ name }) => {
					ipcServer
						.updatePart({
							rundownId,
							groupId,
							partId: part.id,
							part: {
								...part,
								name,
							},
						})
						.catch(handleError)
					setPartPropertiesDialogOpen(false)
				}}
				onDiscarded={() => {
					setPartPropertiesDialogOpen(false)
				}}
			/>
		</div>
	)
}
