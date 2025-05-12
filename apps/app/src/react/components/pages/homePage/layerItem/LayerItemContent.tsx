import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { TextBtn } from '../../../inputs/textBtn/TextBtn.js'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../contexts/Project.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import { Mapping, TSRMappingOptions } from 'timeline-state-resolver-types'
import { DeviceSpecificSettings } from '../layersPage/DeviceSpecificSettings.js'
import './style.scss'
import { getDefaultLayerName } from '../../../../../lib/TSRMappings.js'

export const LayerItemContent: React.FC<{
	mappingId: string
	mapping: Mapping<TSRMappingOptions>
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [name, setName] = useState(props.mapping.layerName)
	useEffect(() => {
		setName(props.mapping.layerName)
	}, [props.mapping])

	const handleNameChange = useCallback(
		(newName: Mapping<TSRMappingOptions>['layerName']) => {
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

	const handleSpecificMappingSettingsUpdate = (mappingUpdate: TSRMappingOptions) => {
		let existingMapping = project.mappings[props.mappingId]
		if (!existingMapping) return

		const oldDefaultName = getDefaultLayerName(existingMapping)

		project.mappings[props.mappingId] = existingMapping = { ...existingMapping, options: mappingUpdate }

		if (existingMapping.layerName === oldDefaultName) {
			// If the layername is the default, update it to the new default:
			existingMapping.layerName = getDefaultLayerName(existingMapping)
		}

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
