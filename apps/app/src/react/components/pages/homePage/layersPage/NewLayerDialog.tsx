import React, { useContext, useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { DeviceOptionsAny, Mapping } from 'timeline-state-resolver-types'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { literal } from '@shared/lib'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { Bridge } from '../../../../../models/project/Bridge'
import { DeviceSpecificSettings } from './DeviceSpecificSettings'

export const NewLayerDialog: React.FC<{
	open: boolean
	deviceId: string
	device: DeviceOptionsAny
	bridges: { [bridgeId: string]: Bridge }
	onClose: () => void
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const [layerName, setLayerName] = useState('')
	const { handleError } = useContext(ErrorHandlerContext)

	const [specificMappingSettings, setSpecificMappingSettings] = useState<Mapping>({
		device: props.device.type,
		deviceId: props.deviceId,
	})

	const handleCreateNewMapping = () => {
		const newMapping = literal<Mapping>({
			...specificMappingSettings,
			device: props.device.type,
			deviceId: props.deviceId,
			layerName: layerName,
		})

		// TODO
		// Chaning random ID to something better
		const mappingId = Date.now() + Math.random()
		project.mappings[mappingId] = newMapping

		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		props.onClose()
	}

	const handleSpecificMappingSettingsUpdate = (mappingUpdate: Mapping) => {
		setSpecificMappingSettings(mappingUpdate)
	}

	useEffect(() => {
		if (!props.open) {
			setLayerName('')
		}
	}, [props.open])

	return (
		<Dialog
			open={props.open}
			onClose={props.onClose}
			onKeyUp={(e) => {
				if (e.key === 'Enter') handleCreateNewMapping()
			}}
		>
			<DialogTitle>Add new layer to {props.deviceId} device</DialogTitle>
			<DialogContent>
				<div className="dialog-form">
					<div className="form-control">
						<TextField
							label="Layer name"
							size="small"
							margin="normal"
							fullWidth
							autoFocus
							value={layerName}
							onChange={(event) => {
								setLayerName(event.target.value)
							}}
						/>
					</div>
					<DeviceSpecificSettings
						mapping={specificMappingSettings}
						device={props.device.type}
						onUpdate={handleSpecificMappingSettingsUpdate}
					/>
				</div>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" onClick={props.onClose}>
					Cancel
				</Button>
				<Button variant="contained" onClick={handleCreateNewMapping}>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	)
}
