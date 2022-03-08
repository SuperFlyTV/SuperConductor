import { Divider, Typography, TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'

export const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [name, setName] = useState(project.name)

	const handleNameChange = useCallback(
		(newName: Project['name']) => {
			if (newName.trim().length <= 0) {
				return
			}

			project.name = newName
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, project]
	)

	useEffect(() => {
		setName(project.name)
	}, [project])

	return (
		<>
			<Typography variant="h6">Project Settings</Typography>
			<Divider />

			<TextField
				margin="normal"
				size="small"
				type="text"
				label="Name"
				value={name}
				onChange={(event) => {
					setName(event.target.value)
				}}
				onBlur={() => {
					handleNameChange(name)
				}}
				onKeyUp={(e) => {
					if (e.key === 'Enter') handleNameChange(name)
				}}
			/>
		</>
	)
}
