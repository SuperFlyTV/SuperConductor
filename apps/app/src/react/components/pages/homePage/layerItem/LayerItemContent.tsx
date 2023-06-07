import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { Mapping } from 'timeline-state-resolver-types'
import { DeviceSpecificSettings } from '../layersPage/DeviceSpecificSettings'
import './style.scss'
import { getDefaultLayerName } from '../../../../../lib/TSRMappings'

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
		const oldMapping = project.mappings[props.mappingId]
		if (oldMapping && oldMapping.layerName === getDefaultLayerName(oldMapping)) {
			// If the layername is the default, update it to the new default:
			mappingUpdate.layerName = getDefaultLayerName(mappingUpdate)
		}

		project.mappings[props.mappingId] = mappingUpdate
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}

	return (
		<div className="layer-item-content">
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
							if (e.key === 'Enter') {
								;(document.activeElement as HTMLInputElement).blur()
								handleNameChange(name)
							}
						}}
						autoFocus={!name}
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
