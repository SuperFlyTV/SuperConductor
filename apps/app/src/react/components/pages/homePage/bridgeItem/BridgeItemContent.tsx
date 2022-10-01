import React, { useCallback, useContext, useState } from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { DevicesList } from '../deviceItem/DevicesList'
import { TextBtn } from '../../../../components/inputs/textBtn/TextBtn'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { Stack, TextField } from '@mui/material'

import './style.scss'
import { NewDeviceDialog } from '../bridgesPage/NewDeviceDialog'

import Toggle from 'react-toggle'
import 'react-toggle/style.css'
import { PeripheralSettings_Any } from '@shared/api'

export const BridgeItemContent: React.FC<{
	id: string
	bridge: Bridge
	bridgeStatus: BridgeStatus
	isInternal?: boolean
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [addDeviceOpen, setAddDeviceOpen] = useState(false)
	const [newlyCreatedDeviceId, setNewlyCreatedDeviceId] = useState<string | undefined>()

	const [name, setName] = useState(props.bridge.name)
	const [url, setUrl] = useState(props.bridge.url)

	const handleNameChange = useCallback(
		(newName: Bridge['name']) => {
			if (newName.trim().length <= 0) {
				return
			}

			props.bridge.name = newName
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[props.bridge, handleError, ipcServer, project]
	)

	const handleUrlChange = useCallback(
		(newUrl: Bridge['url']) => {
			if (newUrl.trim().length <= 0) {
				return
			}

			props.bridge.url = newUrl
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[props.bridge, handleError, ipcServer, project]
	)

	const removeBridge = useCallback(() => {
		delete project.bridges[props.bridge.id]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [props.bridge.id, handleError, ipcServer, project])

	const toggleAutoConnectToAllPeripherals = useCallback(() => {
		props.bridge.settings.autoConnectToAllPeripherals = !props.bridge.settings.autoConnectToAllPeripherals
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project, props.bridge.settings])

	const togglePeripheralManualConnect = useCallback(
		(peripheralSettings?: PeripheralSettings_Any) => {
			if (!peripheralSettings) return
			peripheralSettings.manualConnect = !peripheralSettings.manualConnect
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, project]
	)

	const outgoingBridge: boolean = props.bridge.outgoing
	const autoConnectPanels = props.bridge.settings.autoConnectToAllPeripherals

	return (
		<div className="content">
			{!props.isInternal && (
				<div className="device-item-content">
					<div className="fields">
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

						{outgoingBridge && (
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
						)}
					</div>

					<div className="actions">
						<TextBtn label="Delete" style="danger" onClick={removeBridge} />
					</div>
				</div>
			)}

			<RoundedSection title="Devices" controls={<TextBtn label="Add" onClick={() => setAddDeviceOpen(true)} />}>
				<DevicesList
					project={project}
					bridge={props.bridge}
					devices={props.bridgeStatus ? props.bridgeStatus.devices : {}}
					newlyCreatedDeviceId={newlyCreatedDeviceId}
				/>
			</RoundedSection>

			<RoundedSection
				title="Panels"
				controls={
					<Stack direction="row" spacing={1}>
						<label>Auto-connect to all panels</label>
						<div className="sc-switch">
							<Toggle defaultChecked={autoConnectPanels} onChange={toggleAutoConnectToAllPeripherals} />
						</div>
					</Stack>
				}
			>
				{Object.entries(props.bridgeStatus.peripherals).map(([peripheralId, _peripheral]) => {
					const peripheralSettings = props.bridge.settings.peripherals[peripheralId]
					return (
						<Stack direction="row" spacing={1} key={peripheralId}>
							<div>{peripheralId}</div>
							<Stack direction="row" spacing={1}>
								<label>Connect</label>
								<div className="sc-switch">
									<Toggle
										disabled={autoConnectPanels}
										defaultChecked={!!peripheralSettings?.manualConnect}
										onChange={() => {
											togglePeripheralManualConnect(peripheralSettings)
										}}
									/>
								</div>
							</Stack>
						</Stack>
					)
				})}
			</RoundedSection>

			<NewDeviceDialog
				bridge={props.bridge}
				open={addDeviceOpen}
				onAccepted={(deviceId) => {
					setNewlyCreatedDeviceId(deviceId)
					setAddDeviceOpen(false)
				}}
				onDiscarded={() => {
					setAddDeviceOpen(false)
				}}
			/>
		</div>
	)
}
