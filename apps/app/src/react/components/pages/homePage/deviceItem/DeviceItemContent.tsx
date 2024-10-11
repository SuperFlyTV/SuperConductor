import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { TextBtn } from '../../../../components/inputs/textBtn/TextBtn.js'
import { AtemOptions, CasparCGOptions, DeviceType, OBSOptions, OSCDeviceType } from 'timeline-state-resolver-types'
import { Bridge, BridgeDevice } from '../../../../../models/project/Bridge.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../contexts/Project.js'
import { SelectEnum } from '../../../inputs/SelectEnum.js'
import { BooleanInput } from '../../../inputs/BooleanInput.js'
import Toggle from 'react-toggle'
import { TSRDeviceId, unprotectString } from '@shared/models'

const MIN_PORT = 1
const MAX_PORT = 65535

export const DeviceItemContent: React.FC<{
	bridge: Bridge
	deviceId: TSRDeviceId
	deviceName: string
	device: BridgeDevice
}> = ({ bridge, deviceId, deviceName }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [editedDeviceName, setEditedDeviceName] = useState(deviceName)
	const [host, setHost] = useState('')
	const [port, setPort] = useState(MIN_PORT)
	const [password, setPassword] = useState('')
	const deviceSettings = bridge.settings.devices[unprotectString<TSRDeviceId>(deviceId)]

	const handleDeviceNameChange = useCallback(
		(newName: string) => {
			if (newName.trim().length <= 0) {
				return
			}

			if (project.deviceNames) {
				// Ensure compatibility with old project versions
				project.deviceNames[unprotectString<TSRDeviceId>(deviceId)] = newName
			} else {
				project.deviceNames = { [unprotectString<TSRDeviceId>(deviceId)]: newName }
			}

			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[deviceId, handleError, ipcServer, project]
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
		delete bridge.settings.devices[unprotectString<TSRDeviceId>(deviceId)]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [bridge.settings.devices, deviceId, handleError, ipcServer, project])

	useEffect(() => {
		setEditedDeviceName(deviceName)
	}, [deviceName])

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
				<div className="form-control">
					<TextField
						label="Name"
						value={editedDeviceName}
						size="small"
						margin="dense"
						onChange={(event) => {
							setEditedDeviceName(event.target.value)
						}}
						onBlur={() => {
							handleDeviceNameChange(editedDeviceName)
						}}
						onKeyUp={(e) => {
							if (e.key === 'Enter') {
								handleDeviceNameChange(editedDeviceName)
								;(document.activeElement as HTMLInputElement).blur()
							}
						}}
						autoFocus={!editedDeviceName}
					/>
				</div>
				{deviceSettings.type !== DeviceType.HTTPSEND && (
					<>
						<div className="form-control">
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
									if (e.key === 'Enter') {
										handleHostChange(host)
										;(document.activeElement as HTMLInputElement).blur()
									}
								}}
							/>
						</div>
						<div className="form-control">
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
									if (e.key === 'Enter') {
										handlePortChange(port)
										;(document.activeElement as HTMLInputElement).blur()
									}
								}}
							/>
						</div>
					</>
				)}
				{deviceSettings.type === DeviceType.OBS ? (
					<div className="form-control">
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
								if (e.key === 'Enter') {
									handlePasswordChange(password)
									;(document.activeElement as HTMLInputElement).blur()
								}
							}}
						/>
					</div>
				) : deviceSettings.type === DeviceType.OSC && deviceSettings.options ? (
					<div className="form-control">
						<SelectEnum
							label="Type"
							currentValue={deviceSettings.options.type}
							options={OSCDeviceType}
							onChange={(v) => {
								if (!deviceSettings.options) return
								deviceSettings.options.type = v
								ipcServer.updateProject({ id: project.id, project }).catch(handleError)
							}}
							allowUndefined={false}
						/>
					</div>
				) : deviceSettings.type === DeviceType.HYPERDECK && deviceSettings.options ? (
					<div className="form-control">
						<BooleanInput
							label="Suppress empty slot warnings"
							currentValue={deviceSettings.options.suppressEmptySlotWarnings}
							onChange={(v) => {
								if (!deviceSettings.options) return
								deviceSettings.options.suppressEmptySlotWarnings = v
								ipcServer.updateProject({ id: project.id, project }).catch(handleError)
							}}
						/>
					</div>
				) : (
					<div />
				)}
			</div>
			<div className="actions">
				<TextBtn label="Delete" style="danger" onClick={removeDevice} />
				<>
					<label>Enabled&nbsp;</label>
					<div className="sc-switch">
						<Toggle
							checked={!deviceSettings.disable}
							onChange={() => {
								deviceSettings.disable = !deviceSettings.disable
								ipcServer.updateProject({ id: project.id, project }).catch(handleError)
							}}
						/>
					</div>
				</>
			</div>
		</div>
	)
}
