import { Typography, Button, TextField, Stack } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Bridge as BridgeType, BridgeStatus } from '../../../models/project/Bridge'
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
	const [name, setName] = useState(bridge.name)
	const [url, setUrl] = useState(bridge.url)

	const handleNameChange = useCallback(
		(newName: BridgeType['name']) => {
			if (newName.trim().length <= 0) {
				return
			}

			bridge.name = newName
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[bridge, handleError, ipcServer, project]
	)

	const handleUrlChange = useCallback(
		(newUrl: BridgeType['url']) => {
			if (newUrl.trim().length <= 0) {
				return
			}

			bridge.url = newUrl
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[bridge, handleError, ipcServer, project]
	)

	const removeBridge = useCallback(() => {
		delete project.bridges[bridge.id]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [bridge.id, handleError, ipcServer, project])

	useEffect(() => {
		setName(bridge.name)
		setUrl(bridge.url)
	}, [bridge])

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
					value={name}
					sx={{ marginRight: '0.5rem' }}
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

				<TextField
					margin="normal"
					size="small"
					type="text"
					label="URL"
					value={url}
					onChange={(event) => {
						setUrl(event.target.value)
					}}
					onBlur={() => {
						handleUrlChange(url)
					}}
					onKeyUp={(e) => {
						if (e.key === 'Enter') handleUrlChange(url)
					}}
				/>

				<Button
					variant="contained"
					color="error"
					sx={{ marginTop: '8px', marginLeft: '7rem' }}
					onClick={removeBridge}
				>
					Remove
				</Button>
			</Stack>

			<DeviceList bridge={bridge} devices={bridgeStatus ? bridgeStatus.devices : {}} />
		</React.Fragment>
	)
}
