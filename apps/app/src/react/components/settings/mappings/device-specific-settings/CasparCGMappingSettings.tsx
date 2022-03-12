import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { MappingCasparCG } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'

interface ICasparCGMappingSettingsProps {
	mapping: MappingCasparCG
	mappingId: string
}

export const CasparCGMappingSettings: React.FC<ICasparCGMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [channel, setChannel] = useState(mapping.channel)
	const [layer, setLayer] = useState(mapping.layer)

	const handleChannelChange = useCallback(
		(newChannel: number) => {
			mapping.channel = newChannel
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleLayerChange = useCallback(
		(newLayer: number) => {
			mapping.layer = newLayer
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	useEffect(() => {
		setChannel(mapping.channel)
		setLayer(mapping.layer)
	}, [mapping])

	return (
		<>
			<TextField
				margin="normal"
				size="small"
				label="Channel"
				type="number"
				value={channel}
				InputProps={{ inputProps: { min: 1 } }}
				sx={{ width: '7rem' }}
				onChange={(event) => {
					setChannel(parseInt(event.target.value, 10))
				}}
				onBlur={() => {
					handleChannelChange(channel)
				}}
				onKeyUp={(e) => {
					if (e.key === 'Enter') handleChannelChange(channel)
				}}
			/>
			<TextField
				margin="normal"
				size="small"
				label="Layer"
				type="number"
				value={layer}
				InputProps={{ inputProps: { min: 1 } }}
				sx={{ width: '7rem' }}
				onChange={(event) => {
					setLayer(parseInt(event.target.value, 10))
				}}
				onBlur={() => {
					handleLayerChange(layer)
				}}
				onKeyUp={(e) => {
					if (e.key === 'Enter') handleLayerChange(layer)
				}}
			/>
		</>
	)
}
