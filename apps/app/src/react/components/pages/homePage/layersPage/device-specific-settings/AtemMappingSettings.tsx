import React, { useCallback, useContext } from 'react'
import { MappingAtem, MappingAtemType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../../contexts/Project'
import { IntInput } from '../../../../inputs/IntInput'
import { SelectEnum } from '../../../../inputs/SelectEnum'

interface IAtemMappingSettingsProps {
	mapping: MappingAtem
}

export const AtemMappingSettings: React.FC<IAtemMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

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

	return (
		<>
			<div className="form-control">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={mapping.mappingType}
					options={MappingAtemType}
					onChange={handleMappingTypeChange}
				/>
			</div>

			<div className="form-control">
				<IntInput
					label="Index"
					fullWidth
					currentValue={mapping.index}
					onChange={handleIndexChange}
					allowUndefined={true}
					width="7rem"
				/>
			</div>
		</>
	)
}
