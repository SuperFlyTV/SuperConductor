import React from 'react'
import { IntInput } from '../../../../inputs/IntInput.js'
import { SomeMappingCasparCG } from 'timeline-state-resolver-types'

export const CasparCGMappingSettings: React.FC<{
	mapping: SomeMappingCasparCG
	onUpdate: (mappingUpdate: SomeMappingCasparCG) => void
}> = (props) => {
	return (
		<>
			<div className="form-control">
				<IntInput
					fullWidth
					label="Channel"
					currentValue={props.mapping?.channel}
					width="7rem"
					allowUndefined={false}
					onChange={(v) => {
						props.onUpdate({ ...props.mapping, channel: v })
					}}
					caps={[0, 999]}
				/>
			</div>

			<div className="form-control">
				<IntInput
					fullWidth
					label="Layer"
					currentValue={props.mapping?.layer}
					width="7rem"
					allowUndefined={false}
					onChange={(v) => {
						props.onUpdate({ ...props.mapping, layer: v })
					}}
					caps={[0, 999]}
				/>
			</div>
		</>
	)
}
