/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextField } from '@mui/material'
import React from 'react'
import { MappingCasparCG } from 'timeline-state-resolver-types'

export const CasparCGMappingSettings: React.FC<{
	mapping: MappingCasparCG
	onUpdate: (mappingUpdate: MappingCasparCG) => void
}> = (props) => {
	return (
		<>
			<div className="form-control">
				<TextField
					margin="normal"
					fullWidth
					size="small"
					label="Channel"
					type="number"
					value={props.mapping?.channel || 1}
					InputProps={{ inputProps: { min: 1 } }}
					sx={{ width: '7rem' }}
					onChange={(event) => {
						props.onUpdate({ ...props.mapping, channel: parseInt(event.target.value, 10) })
					}}
				/>
			</div>

			<div className="form-control">
				<TextField
					margin="normal"
					fullWidth
					size="small"
					label="Layer"
					type="number"
					value={props.mapping?.layer || 1}
					InputProps={{ inputProps: { min: 1 } }}
					sx={{ width: '7rem' }}
					onChange={(event) => {
						props.onUpdate({ ...props.mapping, layer: parseInt(event.target.value, 10) })
					}}
				/>
			</div>
		</>
	)
}
