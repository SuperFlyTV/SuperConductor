import React, { useContext, useState, useCallback, useEffect } from 'react'
import { TextField } from '@mui/material'
import classNames from 'classnames'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../../contexts/IPCServer'

export const EditPartName: React.FC<{
	partId: string
	partName: string
	groupOrPartLocked: boolean
	rundownId: string
	parentGroupId: string
}> = ({ partId, partName, groupOrPartLocked, rundownId, parentGroupId }) => {
	const { handleError } = useContext(ErrorHandlerContext)
	const ipcServer = useContext(IPCServerContext)

	const [editingPartName, setEditingPartName] = useState(false)
	const [editedName, setEditedName] = useState(partName)

	useEffect(() => {
		setEditedName(partName)
	}, [partName])
	const submitNameEdit = useCallback(() => {
		ipcServer
			.updatePart({
				rundownId,
				groupId: parentGroupId,
				partId: partId,
				part: {
					name: editedName,
				},
			})
			.catch(handleError)
		setEditingPartName(false)
	}, [editedName, handleError, ipcServer, parentGroupId, partId, rundownId])

	return (
		<>
			{!editingPartName && partName.length > 0 && (
				<div
					title={groupOrPartLocked ? partName : 'Click to edit Part name'}
					className={classNames('title', groupOrPartLocked ? undefined : 'editable')}
					onClick={() => {
						if (groupOrPartLocked) return
						setEditingPartName(true)
					}}
				>
					{partName}
				</div>
			)}

			{editingPartName && (
				<TextField
					size="small"
					value={editedName}
					autoFocus
					variant="standard"
					className="edit-title"
					sx={{ marginTop: '-0.1rem', marginBottom: '0.6rem' }}
					InputProps={{ style: { fontSize: '1.4rem' } }}
					onFocus={(event) => {
						event.target.select()
					}}
					onChange={(event) => {
						setEditedName(event.target.value)
					}}
					onBlur={() => {
						submitNameEdit()
					}}
					onKeyUp={(e) => {
						if (e.key === 'Escape') setEditingPartName(false)
						else if (e.key === 'Enter') submitNameEdit()
					}}
				/>
			)}
		</>
	)
}
