import { Divider, Typography, TextField } from '@mui/material'
import React, { useContext } from 'react'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'

export const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	return (
		<>
			<Typography variant="h6">Project Settings</Typography>
			<Divider />

			<TextField
				margin="normal"
				size="small"
				type="text"
				label="Name"
				defaultValue={project.name}
				onChange={(event) => {
					const newName = event.target.value

					if (newName.trim().length <= 0) {
						return
					}

					const editedProject: Project = {
						...project,
						name: newName,
					}

					ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)
				}}
			/>
		</>
	)
}
