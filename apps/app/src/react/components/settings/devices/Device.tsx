import { Box, Button, TextField, Typography } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { AtemOptions, CasparCGOptions } from 'timeline-state-resolver-types'
import { Bridge, BridgeDevice } from '../../../../models/project/Bridge'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ProjectContext } from '../../../contexts/Project'
import { ConnectionStatus } from '../../util/ConnectionStatus'

const MIN_PORT = 1
const MAX_PORT = 65535

interface IDeviceProps {
	bridge: Bridge
	deviceId: string
	device: BridgeDevice
	editing: boolean
}

export const Device: React.FC<IDeviceProps> = ({ bridge, deviceId, device, editing }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [editedDeviceId, setEditedDeviceId] = useState(deviceId)
	const [host, setHost] = useState('')
	const [port, setPort] = useState(MIN_PORT)
	const deviceSettings = bridge.settings.devices[deviceId]

	const handleDeviceIdChange = useCallback(
		(newId: string) => {
			if (newId.trim().length <= 0) {
				return
			}

			const device = project.bridges[bridge.id].settings.devices[deviceId]
			project.bridges[bridge.id].settings.devices[newId] = device
			delete project.bridges[bridge.id].settings.devices[deviceId]
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[bridge, deviceId, handleError, ipcServer, project]
	)

	const handleHostChange = useCallback(
		(newHost: string) => {
			if (newHost.trim().length <= 0 || !deviceSettings) {
				return
			}

			const options = deviceSettings.options as CasparCGOptions | AtemOptions
			options.host = newHost
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[deviceSettings, handleError, ipcServer, project]
	)

	const handlePortChange = useCallback(
		(newPort: number) => {
			if (newPort < MIN_PORT || newPort > MAX_PORT || !deviceSettings) {
				return
			}

			const options = deviceSettings.options as CasparCGOptions | AtemOptions
			options.port = newPort
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[deviceSettings, handleError, ipcServer, project]
	)

	const removeDevice = useCallback(() => {
		delete bridge.settings.devices[deviceId]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [bridge.settings.devices, deviceId, handleError, ipcServer, project])

	useEffect(() => {
		setEditedDeviceId(deviceId)
	}, [deviceId])

	useEffect(() => {
		const deviceOptions = deviceSettings?.options as CasparCGOptions | AtemOptions
		setHost(deviceOptions?.host ?? '')
		setPort(deviceOptions?.port ?? MIN_PORT)
	}, [deviceSettings])

	if (!deviceSettings) {
		return null
	}

	const deviceOptions = deviceSettings.options as CasparCGOptions | AtemOptions

	if (!deviceOptions) {
		return null
	}

	const deviceAddress = `${deviceOptions.host}:${deviceOptions.port}`

	if (editing) {
		return (
			<Box
				className="device-list-item"
				display="grid"
				gridTemplateColumns="repeat(2, 13rem) 9rem 13rem"
				gridAutoRows="max-content"
				gap={'1rem'}
			>
				<Box gridColumn="span 1">
					<TextField
						label="ID"
						value={editedDeviceId}
						size="small"
						margin="normal"
						onChange={(event) => {
							setEditedDeviceId(event.target.value)
						}}
						onBlur={() => {
							handleDeviceIdChange(editedDeviceId)
						}}
						onKeyUp={(e) => {
							if (e.key === 'Enter') handleDeviceIdChange(editedDeviceId)
						}}
					/>
				</Box>

				<Box display="flex" flexDirection="column" gridColumn="span 1">
					<TextField
						label="URL"
						value={host}
						size="small"
						margin="normal"
						onChange={(event) => {
							setHost(event.target.value)
						}}
						onBlur={() => {
							handleHostChange(host)
						}}
						onKeyUp={(e) => {
							if (e.key === 'Enter') handleHostChange(host)
						}}
					/>
					<TextField
						label="Port"
						value={port}
						size="small"
						margin="normal"
						type="number"
						InputProps={{ inputProps: { min: MIN_PORT, max: MAX_PORT } }}
						onChange={(event) => {
							setPort(parseInt(event.target.value, 10))
						}}
						onBlur={() => {
							handlePortChange(port)
						}}
						onKeyUp={(e) => {
							if (e.key === 'Enter') handlePortChange(port)
						}}
					/>
				</Box>

				<Box gridColumn="span 1">
					<Button variant="contained" color="error" sx={{ marginTop: '18px' }} onClick={removeDevice}>
						Remove
					</Button>
				</Box>

				<Box
					gridColumn="span 1"
					display="flex"
					justifyContent="flex-end"
					alignItems="flex-start"
					paddingTop={'23px'}
				>
					<ConnectionStatus label={device.ok ? 'Connected' : 'Not Connected'} ok={device.ok} />
				</Box>
			</Box>
		)
	}

	return (
		<Box
			className="device-list-item"
			display="grid"
			gridTemplateColumns="repeat(3, 13rem)"
			gridAutoRows="max-content"
			gap={'1rem'}
		>
			<Box gridColumn="span 1">
				<Typography variant="body1" noWrap className="device-list-item__id" title={deviceId}>
					{deviceId}
				</Typography>
			</Box>
			<Box gridColumn="span 1">
				<Typography variant="body1" noWrap className="device-list-item__url" title={deviceAddress}>
					{deviceAddress}
				</Typography>
			</Box>
			<Box gridColumn="span 1" display="flex" justifyContent="flex-end">
				<ConnectionStatus label={device.ok ? 'Connected' : 'Not Connected'} ok={device.ok} />
			</Box>
		</Box>
	)
}
