import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import {
	MappingOBS,
	MappingOBSMute,
	MappingOBSSceneItemRender,
	MappingOBSSourceSettings,
	MappingOBSType,
} from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { SelectEnum } from '../../../inputs/SelectEnum'

interface IOBSMappingSettingsProps {
	mapping: MappingOBS
	mappingId: string
}

export const OBSMappingSettings: React.FC<IOBSMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [sceneName, setSceneName] = useState('')
	const [source, setSource] = useState('')

	const handleMappingTypeChange = useCallback(
		(newMappingType: MappingOBSType) => {
			mapping.mappingType = newMappingType
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleSceneNameChange = useCallback(
		(newSceneName: string) => {
			if (mapping.mappingType === MappingOBSType.SceneItemRender) {
				const mapping0 = mapping as MappingOBSSceneItemRender
				mapping0.sceneName = newSceneName
				ipcServer.updateProject({ id: project.id, project }).catch(handleError)
			}
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleSourceChange = useCallback(
		(newSource: string) => {
			if (
				mapping.mappingType === MappingOBSType.SceneItemRender ||
				mapping.mappingType === MappingOBSType.SourceSettings ||
				mapping.mappingType === MappingOBSType.Mute
			) {
				const mapping0 = mapping as MappingOBSSceneItemRender | MappingOBSSourceSettings | MappingOBSMute
				mapping0.source = newSource
				ipcServer.updateProject({ id: project.id, project }).catch(handleError)
			}
		},
		[handleError, ipcServer, mapping, project]
	)

	useEffect(() => {
		if (mapping.mappingType === MappingOBSType.SceneItemRender) {
			const mapping0 = mapping as MappingOBSSceneItemRender
			setSceneName(mapping0.sceneName ?? '')
		} else {
			setSceneName('')
		}

		if (
			mapping.mappingType === MappingOBSType.SceneItemRender ||
			mapping.mappingType === MappingOBSType.SourceSettings ||
			mapping.mappingType === MappingOBSType.Mute
		) {
			const mapping0 = mapping as MappingOBSSceneItemRender | MappingOBSSourceSettings | MappingOBSMute
			setSource(mapping0.source ?? '')
		} else {
			setSource('')
		}
	}, [mapping])

	return (
		<>
			<SelectEnum
				label="Type"
				currentValue={mapping.mappingType}
				options={MappingOBSType}
				onChange={(v) => {
					handleMappingTypeChange(v)
				}}
			/>

			{mapping.mappingType === MappingOBSType.SceneItemRender && (
				<TextField
					margin="normal"
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
			)}

			{(mapping.mappingType === MappingOBSType.SceneItemRender ||
				mapping.mappingType === MappingOBSType.SourceSettings ||
				mapping.mappingType === MappingOBSType.Mute) && (
				<TextField
					margin="normal"
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
			)}
		</>
	)
}
