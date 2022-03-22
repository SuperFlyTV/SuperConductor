import React, { useCallback, useContext } from 'react'
import { MappingVMixAny, MappingVMixType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'

interface IVMixMappingSettingsProps {
	mapping: MappingVMixAny
	mappingId: string
}

enum VMixMixIndex {
	'One' = 1,
	'Two' = 2,
	'Three' = 3,
	'Four' = 4,
}

enum VMixOverlayIndex {
	'One' = 1,
	'Two' = 2,
	'Three' = 3,
	'Four' = 4,
}

enum VMixOutputIndex {
	'Two' = '2',
	'Three' = '3',
	'Four' = '4',
	'External2' = 'External2',
	'Fullscreen' = 'Fullscreen',
	'Fullscreen2' = 'Fullscreen2',
}

export const VMixMappingSettings: React.FC<IVMixMappingSettingsProps> = ({ mapping }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const updateProject = useCallback(() => {
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	return (
		<>
			<SelectEnum
				label="Type"
				currentValue={mapping.mappingType}
				options={MappingVMixType}
				onChange={(v) => {
					mapping.mappingType = v
					updateProject()
				}}
			/>

			{(mapping.mappingType === MappingVMixType.Program || mapping.mappingType === MappingVMixType.Preview) && (
				<SelectEnum
					label="Index"
					currentValue={mapping.index}
					options={VMixMixIndex}
					onChange={(v) => {
						mapping.index = v
						updateProject()
					}}
				/>
			)}

			{mapping.mappingType === MappingVMixType.Overlay && (
				<SelectEnum
					label="Index"
					currentValue={mapping.index}
					options={VMixOverlayIndex}
					onChange={(v) => {
						mapping.index = v
						updateProject()
					}}
				/>
			)}

			{(mapping.mappingType === MappingVMixType.Input ||
				mapping.mappingType === MappingVMixType.AudioChannel) && (
				<IntInput
					label="Index"
					currentValue={mapping.index as number}
					onChange={(v) => {
						mapping.index = v
						updateProject()
					}}
					allowUndefined={false}
				/>
			)}

			{mapping.mappingType === MappingVMixType.Output && (
				<SelectEnum
					label="Index"
					currentValue={mapping.index}
					options={VMixOutputIndex}
					onChange={(v) => {
						mapping.index = v
						updateProject()
					}}
				/>
			)}

			{mapping.mappingType === MappingVMixType.AudioChannel && (
				<TextInput
					label="Input Layer"
					currentValue={mapping.inputLayer}
					onChange={(v) => {
						mapping.inputLayer = v
						updateProject()
					}}
					allowUndefined={true}
				/>
			)}
		</>
	)
}
