import { MenuItem, TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { MappingAtem, MappingAtemType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'

interface IAtemMappingSettingsProps {
	mapping: MappingAtem
	mappingId: string
}

export const AtemMappingSettings: React.FC<IAtemMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [mappingType, setMappingType] = useState(mapping.mappingType)
	const [index, setIndex] = useState(mapping.index)

	const handleMappingTypeChange = useCallback(
		(newMappingType: MappingAtemType) => {
			mapping.mappingType = newMappingType
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleIndexChange = useCallback(
		(newIndex: MappingAtem['index']) => {
			mapping.index = newIndex
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	useEffect(() => {
		setMappingType(mapping.mappingType)
		setIndex(mapping.index)
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
				<MenuItem value={MappingAtemType.MixEffect}>MixEffect</MenuItem>
				<MenuItem value={MappingAtemType.DownStreamKeyer}>DownStreamKeyer</MenuItem>
				<MenuItem value={MappingAtemType.SuperSourceBox}>SuperSourceBox</MenuItem>
				<MenuItem value={MappingAtemType.Auxilliary}>Auxilliary</MenuItem>
				<MenuItem value={MappingAtemType.MediaPlayer}>MediaPlayer</MenuItem>
				<MenuItem value={MappingAtemType.SuperSourceProperties}>SuperSourceProperties</MenuItem>
				<MenuItem value={MappingAtemType.AudioChannel}>AudioChannel</MenuItem>
				<MenuItem value={MappingAtemType.MacroPlayer}>MacroPlayer</MenuItem>
			</TextField>
			<TextField
				margin="normal"
				size="small"
				label="Index"
				type="number"
				value={index}
				InputProps={{ inputProps: { min: 0 } }}
				sx={{ width: '7rem' }}
				onChange={(event) => {
					setIndex(parseInt(event.target.value, 10))
				}}
				onBlur={() => {
					handleIndexChange(index)
				}}
				onKeyUp={(e) => {
					if (e.key === 'Enter') handleIndexChange(index)
				}}
			/>
		</>
	)
}
