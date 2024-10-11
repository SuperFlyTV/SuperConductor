import React, { useCallback, useContext, useState } from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge.js'
import { RoundedSection } from '../roundedSection/RoundedSection.js'
import { DevicesList } from '../deviceItem/DevicesList.js'
import { TextBtn } from '../../../../components/inputs/textBtn/TextBtn.js'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../contexts/Project.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import { Stack, TextField } from '@mui/material'
import { PeripheralsList } from '../peripheralsList/PeripheralsList.js'

import './style.scss'
import { NewDeviceDialog } from '../bridgesPage/NewDeviceDialog.js'

import Toggle from 'react-toggle'
import 'react-toggle/style.css'
import { TSRDeviceId, unprotectString } from '@shared/models'
import { BridgeId } from '@shared/api'

export const BridgeItemContent: React.FC<{
	id: string
	bridge: Bridge
	bridgeStatus: BridgeStatus | undefined
	isInternal?: boolean
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [addDeviceOpen, setAddDeviceOpen] = useState(false)
	const [newlyCreatedDeviceId, setNewlyCreatedDeviceId] = useState<TSRDeviceId | undefined>()

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
		delete project.bridges[unprotectString<BridgeId>(props.bridge.id)]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [props.bridge.id, handleError, ipcServer, project])

	const toggleAutoConnectToAllPeripherals = useCallback(() => {
		props.bridge.settings.autoConnectToAllPeripherals = !props.bridge.settings.autoConnectToAllPeripherals
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project, props.bridge.settings])

	const outgoingBridge: boolean = props.bridge.outgoing

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
							<Toggle
								checked={props.bridge.settings.autoConnectToAllPeripherals}
								onChange={toggleAutoConnectToAllPeripherals}
							/>
						</div>
					</Stack>
				}
			>
				<PeripheralsList
					autoConnectToAllPeripherals={props.bridge.settings.autoConnectToAllPeripherals}
					bridgeId={props.bridge.id}
					statuses={props.bridgeStatus ? props.bridgeStatus.peripherals : {}}
					settings={props.bridge.settings.peripherals}
				/>
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
