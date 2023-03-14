import { Button } from '@mui/material'
import React, { useContext, useState } from 'react'
import { MdOutlineEditNote } from 'react-icons/md'
import { PartGUI } from '../../../../../../models/rundown/Part'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { PartPropertiesDialog } from './PartPropertiesDialog'

export const PartSubmenu: React.FC<{
	rundownId: string
	groupId: string
	part: PartGUI
	/** Part or group locked */
	locked: boolean
}> = ({ rundownId, groupId, part, locked }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [partPropertiesDialogOpen, setPartPropertiesDialogOpen] = useState(false)

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
			</div>

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
