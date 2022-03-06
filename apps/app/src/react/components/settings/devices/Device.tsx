import { Box, Button, TextField, Typography } from '@mui/material'
import React, { useCallback, useContext } from 'react'
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
	const deviceSettings = bridge.settings.devices[deviceId]

	const onDeviceIdChange = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			const newId = event.target.value

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

	const onDeviceHostChange = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			const newHost = event.target.value

			if (newHost.trim().length <= 0) {
				return
			}

			const options = bridge.settings.devices[deviceId].options as CasparCGOptions | AtemOptions
			options.host = newHost
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[bridge, deviceId, handleError, ipcServer, project]
	)

	const onDevicePortChange = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			const newPort = parseInt(event.target.value, 10)

			if (newPort < MIN_PORT || newPort > MAX_PORT) {
				return
			}

			const options = bridge.settings.devices[deviceId].options as CasparCGOptions | AtemOptions
			options.port = newPort
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[bridge, deviceId, handleError, ipcServer, project]
	)

	const removeDevice = useCallback(() => {
		delete bridge.settings.devices[deviceId]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [bridge.settings.devices, deviceId, handleError, ipcServer, project])

	if (!deviceSettings) {
		return null
	}

	const deviceOptions = bridge.settings.devices[deviceId].options as CasparCGOptions | AtemOptions

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
						defaultValue={deviceId}
						size="small"
						margin="normal"
						onChange={onDeviceIdChange}
					/>
				</Box>

				<Box display="flex" flexDirection="column" gridColumn="span 1">
					<TextField
						label="URL"
						defaultValue={deviceOptions.host}
						size="small"
						margin="normal"
						onChange={onDeviceHostChange}
					/>
					<TextField
						label="Port"
						defaultValue={deviceOptions.port}
						size="small"
						margin="normal"
						type="number"
						InputProps={{ inputProps: { min: MIN_PORT, max: MAX_PORT } }}
						onChange={onDevicePortChange}
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
