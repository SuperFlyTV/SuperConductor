import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import React from 'react'

export const BooleanInput: React.FC<{
	currentValue: boolean | undefined
	onChange: (newValue: boolean) => void
	label: string
}> = ({ currentValue, onChange, label }) => {
	return (
		<FormGroup>
			<FormControlLabel
				control={
					<Checkbox
						onChange={(e) => {
							onChange(e.target.checked)
						}}
						checked={!!currentValue}
					/>
				}
				label={label}
			/>
		</FormGroup>
	)
}
