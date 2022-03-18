import { MenuItem, TextField } from '@mui/material'
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

interface IOBSMappingSettingsProps {
	mapping: MappingOBS
	mappingId: string
}

export const OBSMappingSettings: React.FC<IOBSMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [mappingType, setMappingType] = useState(mapping.mappingType)
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
		setMappingType(mapping.mappingType)

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
			<TextField
				select
				margin="normal"
				size="small"
				label="Type"
				value={mappingType}
				sx={{ width: '21rem' }}
				onChange={(event) => {
					setMappingType(parseInt(event.target.value, 10))
				}}
				onBlur={() => {
					handleMappingTypeChange(mappingType)
				}}
				onKeyUp={(e) => {
					if (e.key === 'Enter') handleMappingTypeChange(mappingType)
				}}
			>
				<MenuItem value={MappingOBSType.CurrentScene}>CurrentScene</MenuItem>
				<MenuItem value={MappingOBSType.CurrentTransition}>CurrentTransition</MenuItem>
				<MenuItem value={MappingOBSType.Mute}>Mute</MenuItem>
				<MenuItem value={MappingOBSType.Recording}>Recording</MenuItem>
				<MenuItem value={MappingOBSType.SceneItemRender}>SceneItemRender</MenuItem>
				<MenuItem value={MappingOBSType.SourceSettings}>SourceSettings</MenuItem>
				<MenuItem value={MappingOBSType.Streaming}>Streaming</MenuItem>
			</TextField>

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
