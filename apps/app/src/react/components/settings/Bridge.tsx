import { Typography, Button, TextField, Stack } from '@mui/material'
import React, { useContext } from 'react'
import { Bridge as BridgeType, BridgeStatus } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { IPCServerContext } from '../../contexts/IPCServer'
import { ProjectContext } from '../../contexts/Project'
import { ConnectionStatus } from '../util/ConnectionStatus'
import { DeviceList } from './devices/DeviceList'

interface IBridgeProps {
	bridge: BridgeType
	bridgeStatus: BridgeStatus
}

export const Bridge: React.FC<IBridgeProps> = ({ bridge, bridgeStatus }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	return (
		<React.Fragment>
			<Stack direction="row">
				<Typography variant="body1" sx={{ fontStyle: 'italic', marginRight: '1rem' }}>
					ID: {bridge.id}
				</Typography>

				<ConnectionStatus
					label={bridgeStatus?.connected ? 'Connected' : 'Not Connected'}
					ok={bridgeStatus?.connected}
				/>
			</Stack>

			<Stack direction="row" alignItems="center">
				<TextField
					margin="normal"
					size="small"
					type="text"
					label="Name"
					defaultValue={bridge.name}
					onChange={(event) => {
						const newName = event.target.value

						if (newName.trim().length <= 0) {
							return
						}

						const editedBridges = {
							...project.bridges,
						}

						editedBridges[bridge.id] = {
							...bridge,
							name: newName,
						}

						const editedProject: Project = {
							...project,
							bridges: editedBridges,
						}

						ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)
					}}
					sx={{ marginRight: '0.5rem' }}
				/>

				<TextField
					margin="normal"
					size="small"
					type="text"
					label="URL"
					defaultValue={bridge.url}
					onChange={(event) => {
						const newURL = event.target.value

						if (newURL.trim().length <= 0) {
							return
						}

						const editedBridges = {
							...project.bridges,
						}

						editedBridges[bridge.id] = {
							...bridge,
							url: newURL,
						}

						const editedProject: Project = {
							...project,
							bridges: editedBridges,
						}

						ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)
					}}
				/>

				<Button
					variant="contained"
					color="error"
					sx={{ marginTop: '8px', marginLeft: '7rem' }}
					onClick={() => {
						const filteredBridges = Object.fromEntries(
							Object.entries(project.bridges).filter(([id]) => id !== bridge.id)
						)

						const editedProject: Project = {
							...project,
							bridges: filteredBridges,
						}

						ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)
					}}
				>
					Remove
				</Button>
			</Stack>

			<DeviceList bridge={bridge} devices={bridgeStatus ? bridgeStatus.devices : {}} />
		</React.Fragment>
	)
}
