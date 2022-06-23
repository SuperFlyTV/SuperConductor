import React, { useCallback, useContext } from 'react'
import { MappingVMixAny, MappingVMixType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../../contexts/Project'
import { IntInput } from '../../../../inputs/IntInput'
import { SelectEnum } from '../../../../inputs/SelectEnum'
import { TextInput } from '../../../../inputs/TextInput'

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

export const VMixMappingSettings: React.FC<{
	mapping: MappingVMixAny
	onUpdate: (mappingUpdate: MappingVMixAny) => void
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const updateProject = useCallback(() => {
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	return (
		<>
			<div className="form-control">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={props.mapping.mappingType}
					options={MappingVMixType}
					onChange={(v) => {
						props.onUpdate({ ...props.mapping, mappingType: v })
					}}
				/>
			</div>

			{(props.mapping.mappingType === MappingVMixType.Program ||
				props.mapping.mappingType === MappingVMixType.Preview) && (
				<div className="form-control">
					<SelectEnum
						label="Index"
						fullWidth
						currentValue={props.mapping.index}
						options={VMixMixIndex}
						onChange={(v) => {
							if (
								props.mapping.mappingType === MappingVMixType.Program ||
								props.mapping.mappingType === MappingVMixType.Preview
							) {
								props.onUpdate({ ...props.mapping, index: v })
							}
						}}
					/>
				</div>
			)}

			{props.mapping.mappingType === MappingVMixType.Overlay && (
				<div className="form-control">
					<SelectEnum
						label="Index"
						fullWidth
						currentValue={props.mapping.index}
						options={VMixOverlayIndex}
						onChange={(v) => {
							if (props.mapping.mappingType === MappingVMixType.Overlay) {
								props.onUpdate({ ...props.mapping, index: v })
							}
							updateProject()
						}}
					/>
				</div>
			)}

			{(props.mapping.mappingType === MappingVMixType.Input ||
				props.mapping.mappingType === MappingVMixType.AudioChannel) && (
				<div className="form-control">
					<IntInput
						label="Index"
						fullWidth
						width="7rem"
						currentValue={props.mapping.index as number}
						onChange={(v) => {
							if (
								props.mapping.mappingType === MappingVMixType.Input ||
								props.mapping.mappingType === MappingVMixType.AudioChannel
							) {
								props.onUpdate({ ...props.mapping, index: v })
							}
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			)}

			{props.mapping.mappingType === MappingVMixType.Output && (
				<div className="form-control">
					<SelectEnum
						label="Index"
						currentValue={props.mapping.index}
						options={VMixOutputIndex}
						onChange={(v) => {
							if (props.mapping.mappingType === MappingVMixType.Output) {
								props.onUpdate({ ...props.mapping, index: v })
							}
							updateProject()
						}}
					/>
				</div>
			)}

			{props.mapping.mappingType === MappingVMixType.AudioChannel && (
				<div className="form-control">
					<TextInput
						label="Input Layer"
						fullWidth
						currentValue={props.mapping.inputLayer}
						onChange={(v) => {
							if (props.mapping.mappingType === MappingVMixType.AudioChannel) {
								props.onUpdate({ ...props.mapping, inputLayer: v })
							}
						}}
						allowUndefined={true}
					/>
				</div>
			)}
		</>
	)
}
