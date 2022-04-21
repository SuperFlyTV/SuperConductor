/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material'

import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { DevicesList } from '../deviceItem/DevicesList'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { NewDeviceDialog } from '../../../settings/devices/NewDeviceDialog'

import './style.scss'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { DeviceType, Mapping } from 'timeline-state-resolver-types'
import { EditMapping } from '../../../settings/mappings/EditMapping'
import { findDeviceOfType, listAvailableDeviceIDs } from '../../../../../lib/util'
import { DeviceSpecificSettings } from '../layersPage/DeviceSpecificSettings'

export const LayerItemContent: React.FC<{
	mappingId: string
	mapping: Mapping
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [name, setName] = useState(props.mapping.layerName)
	useEffect(() => {
		setName(props.mapping.layerName)
	}, [props.mapping])

	const handleNameChange = useCallback(
		(newName: Mapping['layerName']) => {
			if (typeof newName === 'undefined' || newName.trim().length <= 0) {
				return
			}

			project.mappings[props.mappingId].layerName = newName
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, props.mappingId, project]
	)

	const removeMapping = useCallback(() => {
		delete project.mappings[props.mappingId]
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, props.mappingId, project])

	const handleSpecificMappingSettingsUpdate = (mappingUpdate: Mapping) => {
		project.mappings[props.mappingId] = mappingUpdate
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}

	return (
		<div className="device-item-content">
			<div className="fields">
				<div className="form-control">
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
				</div>
				<DeviceSpecificSettings
					mapping={props.mapping}
					device={props.mapping.device}
					onUpdate={handleSpecificMappingSettingsUpdate}
				/>
			</div>
			<div className="actions">
				<TextBtn label="Delete" style="danger" onClick={removeMapping} />
			</div>
		</div>
	)
}
