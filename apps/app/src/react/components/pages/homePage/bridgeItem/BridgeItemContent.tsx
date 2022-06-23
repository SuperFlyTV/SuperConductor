import React, { useCallback, useContext, useState } from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { DevicesList } from '../deviceItem/DevicesList'
import { TextBtn } from '../../../../components/inputs/textBtn/TextBtn'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { TextField } from '@mui/material'

import './style.scss'
import { NewDeviceDialog } from '../bridgesPage/NewDeviceDialog'

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
