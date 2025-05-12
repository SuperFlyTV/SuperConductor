import React from 'react'
import { SomeMappingVmix, MappingVmixType } from 'timeline-state-resolver-types'

import { IntInput } from '../../../../inputs/IntInput.js'
import { SelectEnum } from '../../../../inputs/SelectEnum.js'
import { TextInput } from '../../../../inputs/TextInput.js'

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
	mapping: SomeMappingVmix
	onUpdate: (mappingUpdate: SomeMappingVmix) => void
}> = (props) => {
	return (
		<>
			<div className="form-control">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={props.mapping.mappingType}
					options={MappingVmixType}
					onChange={(v) => {
						props.onUpdate({ ...props.mapping, mappingType: v })
					}}
				/>
			</div>

			{(props.mapping.mappingType === MappingVmixType.Program ||
				props.mapping.mappingType === MappingVmixType.Preview) && (
				<div className="form-control">
					<SelectEnum
						label="Index"
						fullWidth
						currentValue={props.mapping.index}
						options={VMixMixIndex}
						onChange={(v) => {
							if (
								props.mapping.mappingType === MappingVmixType.Program ||
								props.mapping.mappingType === MappingVmixType.Preview
							) {
								props.onUpdate({ ...props.mapping, index: v })
							}
						}}
					/>
				</div>
			)}

			{props.mapping.mappingType === MappingVmixType.Overlay && (
				<div className="form-control">
					<SelectEnum
						label="Index"
						fullWidth
						currentValue={props.mapping.index}
						options={VMixOverlayIndex}
						onChange={(v) => {
							if (props.mapping.mappingType === MappingVmixType.Overlay) {
								props.onUpdate({ ...props.mapping, index: v })
							}
						}}
					/>
				</div>
			)}

			{(props.mapping.mappingType === MappingVmixType.Input ||
				props.mapping.mappingType === MappingVmixType.AudioChannel) && (
				<div className="form-control">
					<IntInput
						label="Index"
						fullWidth
						width="7rem"
						currentValue={Number(props.mapping.index)}
						onChange={(v) => {
							if (
								props.mapping.mappingType === MappingVmixType.Input ||
								props.mapping.mappingType === MappingVmixType.AudioChannel
							) {
								props.onUpdate({ ...props.mapping, index: v + '' })
							}
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			)}

			{props.mapping.mappingType === MappingVmixType.Output && (
				<div className="form-control">
					<SelectEnum
						label="Index"
						currentValue={props.mapping.index}
						options={VMixOutputIndex}
						onChange={(v) => {
							if (props.mapping.mappingType === MappingVmixType.Output) {
								props.onUpdate({ ...props.mapping, index: v })
							}
						}}
					/>
				</div>
			)}

			{props.mapping.mappingType === MappingVmixType.AudioChannel && (
				<div className="form-control">
					<TextInput
						label="Input Layer"
						fullWidth
						currentValue={props.mapping.inputLayer}
						onChange={(v) => {
							if (props.mapping.mappingType === MappingVmixType.AudioChannel) {
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
