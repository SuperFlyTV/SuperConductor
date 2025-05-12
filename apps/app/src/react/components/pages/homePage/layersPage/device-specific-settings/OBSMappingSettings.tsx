import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { SomeMappingObs, MappingObsType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler.js'
import { IPCServerContext } from '../../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../../contexts/Project.js'
import { SelectEnum } from '../../../../inputs/SelectEnum.js'

interface IOBSMappingSettingsProps {
	mapping: SomeMappingObs
}

export const OBSMappingSettings: React.FC<IOBSMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [sceneName, setSceneName] = useState('')
	const [source, setSource] = useState('')

	const handleMappingTypeChange = useCallback(
		(newMappingType: MappingObsType) => {
			mapping.mappingType = newMappingType
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleSceneNameChange = useCallback(
		(newSceneName: string) => {
			if (mapping.mappingType === MappingObsType.SceneItem) {
				mapping.sceneName = newSceneName
				ipcServer.updateProject({ id: project.id, project }).catch(handleError)
			}
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleSourceChange = useCallback(
		(newSource: string) => {
			if (mapping.mappingType === MappingObsType.SceneItem) {
				mapping.source = newSource
				ipcServer.updateProject({ id: project.id, project }).catch(handleError)
			} else if (
				mapping.mappingType === MappingObsType.InputSettings ||
				mapping.mappingType === MappingObsType.InputAudio
			) {
				mapping.input = newSource
				ipcServer.updateProject({ id: project.id, project }).catch(handleError)
			}
		},
		[handleError, ipcServer, mapping, project]
	)

	useEffect(() => {
		if (mapping.mappingType === MappingObsType.SceneItem) {
			setSceneName(mapping.sceneName ?? '')
		} else {
			setSceneName('')
		}

		if (mapping.mappingType === MappingObsType.SceneItem) {
			setSource(mapping.source ?? '')
		} else if (
			mapping.mappingType === MappingObsType.InputSettings ||
			mapping.mappingType === MappingObsType.InputAudio
		) {
			setSource(mapping.input ?? '')
		} else {
			setSource('')
		}
	}, [mapping])

	return (
		<>
			<div className="form-control">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={mapping.mappingType}
					options={MappingObsType}
					onChange={(v) => {
						handleMappingTypeChange(v)
					}}
				/>
			</div>

			{mapping.mappingType === MappingObsType.SceneItem && (
				<div className="form-control">
					<TextField
						margin="normal"
						fullWidth
						size="small"
						label="Scene Name"
						value={sceneName}
						onChange={(event) => {
							setSceneName(event.target.value)
						}}
						onBlur={() => {
							handleSceneNameChange(sceneName)
						}}
						onKeyUp={(e) => {
							if (e.key === 'Enter') handleSceneNameChange(sceneName)
						}}
					/>
				</div>
			)}

			{(mapping.mappingType === MappingObsType.SceneItem ||
				mapping.mappingType === MappingObsType.InputSettings ||
				mapping.mappingType === MappingObsType.InputAudio) && (
				<div className="form-control">
					<TextField
						margin="normal"
						fullWidth
						size="small"
						label="Source"
						value={source}
						onChange={(event) => {
							setSource(event.target.value)
						}}
						onBlur={() => {
							handleSourceChange(source)
						}}
						onKeyUp={(e) => {
							if (e.key === 'Enter') handleSourceChange(source)
						}}
					/>
				</div>
			)}
		</>
	)
}
