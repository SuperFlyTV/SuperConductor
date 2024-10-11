import React, { useCallback, useContext } from 'react'
import { MappingTriCaster, MappingTriCasterType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler.js'
import { IPCServerContext } from '../../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../../contexts/Project.js'
import { SelectEnum } from '../../../../inputs/SelectEnum.js'
import { TextInput } from '../../../../inputs/TextInput.js'

interface ITriCasterMappingSettingsProps {
	mapping: MappingTriCaster
}

export const TriCasterMappingSettings: React.FC<ITriCasterMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const handleMappingTypeChange = useCallback(
		(newMappingType: MappingTriCasterType) => {
			mapping.mappingType = newMappingType
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, mapping, project]
	)

	const handleNameChange = useCallback(
		(newName: string) => {
			mapping.name = newName as MappingTriCaster['name'] // TODO: make some dropdowns and/or validation
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
					options={MappingTriCasterType}
					onChange={handleMappingTypeChange}
				/>
			</div>

			<div className="form-control">
				<TextInput fullWidth currentValue={mapping.name} onChange={handleNameChange} allowUndefined={false} />
			</div>
		</>
	)
}
