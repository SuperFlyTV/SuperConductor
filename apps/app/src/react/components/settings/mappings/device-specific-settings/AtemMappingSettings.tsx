import { TextField } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { MappingAtem, MappingAtemType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { SelectEnum } from '../../../inputs/SelectEnum'

interface IAtemMappingSettingsProps {
	mapping: MappingAtem
	mappingId: string
}

export const AtemMappingSettings: React.FC<IAtemMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
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
		setIndex(mapping.index)
	}, [mapping])

	return (
		<>
			<SelectEnum
				label="Type"
				currentValue={mapping.mappingType}
				options={MappingAtemType}
				onChange={(v) => {
					handleMappingTypeChange(v)
				}}
			/>

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
