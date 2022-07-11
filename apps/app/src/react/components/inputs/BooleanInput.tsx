import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import React from 'react'

export const BooleanInput: React.FC<{
	currentValue: boolean | undefined
	onChange: (newValue: boolean) => void
	label: string
	disabled?: boolean
}> = ({ currentValue, onChange, label, disabled }) => {
	return (
		<FormGroup>
			<FormControlLabel
				control={
					<Checkbox
						onChange={(e) => {
							onChange(e.target.checked)
						}}
						checked={!!currentValue}
						disabled={disabled}
					/>
				}
				label={label}
			/>
		</FormGroup>
	)
}
