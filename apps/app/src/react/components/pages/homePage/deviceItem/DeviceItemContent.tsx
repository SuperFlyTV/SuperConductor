import { Box, TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { TextBtn } from '../../../../components/inputs/textBtn/TextBtn'
import { AtemOptions, CasparCGOptions, DeviceType, OBSOptions, OSCDeviceType } from 'timeline-state-resolver-types'
import { Bridge, BridgeDevice } from '../../../../../models/project/Bridge'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { SelectEnum } from '../../../inputs/SelectEnum'

const MIN_PORT = 1
const MAX_PORT = 65535

export const DeviceItemContent: React.FC<{
	bridge: Bridge
	deviceId: string
	device: BridgeDevice
}> = ({ bridge, deviceId }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [editedDeviceId, setEditedDeviceId] = useState(deviceId)
	const [host, setHost] = useState('')
	const [port, setPort] = useState(MIN_PORT)
	const [password, setPassword] = useState('')
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

	const handlePasswordChange = useCallback(
		(newPassword: string) => {
			if (!deviceSettings) {
				return
			}

			const options = deviceSettings?.options as OBSOptions
			options.password = newPassword
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

		if (deviceSettings?.type === DeviceType.OBS) {
			setPassword(deviceSettings.options?.password ?? '')
		} else {
			setPassword('')
		}
	}, [deviceSettings])

	if (!deviceSettings) {
		return null
	}

	const deviceOptions = deviceSettings.options as CasparCGOptions | AtemOptions

	if (!deviceOptions) {
		return null
	}
	if (!deviceSettings) return null

	return (
		<div className="device-item-content">
			<div className="fields">
				<TextField
					label="ID"
					value={editedDeviceId}
					size="small"
					margin="dense"
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
				<TextField
					label="URL"
					value={host}
					size="small"
					margin="dense"
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
					margin="dense"
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
				{deviceSettings.type === DeviceType.OBS ? (
					<Box gridColumn="span 1">
						<TextField
							label="Password"
							type="password"
							value={password}
							size="small"
							margin="dense"
							onChange={(event) => {
								setPassword(event.target.value)
							}}
							onBlur={() => {
								handlePasswordChange(password)
							}}
							onKeyUp={(e) => {
								if (e.key === 'Enter') handlePasswordChange(password)
							}}
						/>
					</Box>
				) : deviceSettings.type === DeviceType.OSC && deviceSettings.options ? (
					<Box gridColumn="span 1">
						<SelectEnum
							label="Type"
							fullWidth
							currentValue={deviceSettings.options.type}
							options={OSCDeviceType}
							onChange={(v) => {
								if (!deviceSettings.options) return
								deviceSettings.options.type = v
								ipcServer.updateProject({ id: project.id, project }).catch(handleError)
							}}
							allowUndefined={false}
						/>
					</Box>
				) : (
					<div />
				)}
			</div>
			<div className="actions">
				<TextBtn label="Delete" style="danger" onClick={removeDevice} />
			</div>
		</div>
	)
}
