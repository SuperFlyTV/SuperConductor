import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { DeviceType, Mapping, Mapping as MappingType } from 'timeline-state-resolver-types'
import { findDeviceOfType, listAvailableDeviceIDs } from '../../../../lib/util'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ProjectContext } from '../../../contexts/Project'
import { DeviceSpecificSettings } from './DeviceSpecificSettings'

interface IMappingProps {
	mapping: MappingType
	mappingId: string
}

export const EditMapping: React.FC<IMappingProps> = ({ mapping, mappingId }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [name, setName] = useState(mapping.layerName)
	const [device, setDevice] = useState(mapping.device)
	const [deviceId, setDeviceId] = useState(mapping.deviceId)

	const handleNameChange = useCallback(
		(newName: Mapping['layerName']) => {
			if (typeof newName === 'undefined' || newName.trim().length <= 0) {
				return
			}

			project.mappings[mappingId].layerName = newName
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mappingId, project]
	)

	const handleDeviceTypeChange = useCallback(
		(newDeviceType: Mapping['device']) => {
			const newDeviceId = findDeviceOfType(project.bridges, newDeviceType)
			if (!newDeviceId) {
				return
			}

			project.mappings[mappingId].device = newDeviceType
			project.mappings[mappingId].deviceId = newDeviceId
			setDeviceId(newDeviceId)
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mappingId, project]
	)

	const handleDeviceIdChange = useCallback(
		(newDeviceId: Mapping['deviceId']) => {
			project.mappings[mappingId].deviceId = newDeviceId
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mappingId, project]
	)

	const removeMapping = useCallback(() => {
		delete project.mappings[mappingId]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, mappingId, project])

	useEffect(() => {
		setName(mapping.layerName)
		setDevice(mapping.device)
		setDeviceId(mapping.deviceId)
	}, [mapping])

	return (
		<div>
			<Typography variant="body1" fontStyle="italic" marginBottom="-1rem">
				ID: {mappingId}
			</Typography>
			<Stack direction="row" spacing={1} alignItems="baseline">
				<TextField
					margin="normal"
					size="small"
					label="Name"
					value={name}
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
					select
					margin="normal"
					size="small"
					label="Device Type"
					value={device.toString()}
					sx={{ width: '12rem' }}
					onChange={(event) => {
						setDevice(parseInt(event.target.value, 10))
					}}
					onBlur={() => {
						handleDeviceTypeChange(device)
					}}
					onKeyUp={(e) => {
						if (e.key === 'Enter') handleDeviceTypeChange(device)
					}}
				>
					<MenuItem value={DeviceType.CASPARCG}>CasparCG</MenuItem>
					<MenuItem value={DeviceType.ATEM}>ATEM</MenuItem>
					<MenuItem value={DeviceType.OBS}>OBS</MenuItem>
					<MenuItem value={DeviceType.VMIX}>VMIX</MenuItem>
					{/* @TODO: More device types */}
				</TextField>
				<TextField
					select
					margin="normal"
					size="small"
					label="Device ID"
					value={deviceId}
					sx={{ width: '12rem' }}
					onChange={(event) => {
						setDeviceId(event.target.value)
					}}
					onBlur={() => {
						handleDeviceIdChange(deviceId)
					}}
					onKeyUp={(e) => {
						if (e.key === 'Enter') handleDeviceIdChange(deviceId)
					}}
				>
					{listAvailableDeviceIDs(project.bridges, mapping.device).map((deviceId) => (
						<MenuItem key={deviceId} value={deviceId}>
							{deviceId}
						</MenuItem>
					))}
				</TextField>
				<div style={{ width: '2rem' }} />
				<DeviceSpecificSettings mapping={mapping} mappingId={mappingId} />
				<Button
					variant="contained"
					color="error"
					onClick={removeMapping}
					sx={{ position: 'relative', height: '40px', top: '-2px' }}
				>
					Remove
				</Button>
			</Stack>
		</div>
	)
}
