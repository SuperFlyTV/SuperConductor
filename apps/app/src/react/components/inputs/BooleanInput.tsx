import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import React from 'react'

export const BooleanInput: React.FC<{
	currentValue: boolean | undefined
	onChange: (newValue: boolean) => void
	label: string | number | React.ReactElement<any, string | React.JSXElementConstructor<any>>
	disabled?: boolean
	endAdornment?: React.ReactNode
}> = ({ currentValue, onChange, label, disabled, endAdornment }) => {
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
			{endAdornment}
		</FormGroup>
	)
}
