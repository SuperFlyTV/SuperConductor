import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import React from 'react'

export const BooleanInput: React.FC<{
	currentValue: boolean | undefined
	onChange: (newValue: boolean) => void
	label: string | number | React.ReactElement<any, string | React.JSXElementConstructor<any>>
	disabled?: boolean
	indeterminate?: boolean
	endAdornment?: React.ReactNode
}> = ({ currentValue, onChange, label, disabled, indeterminate, endAdornment }) => {
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
						indeterminate={indeterminate}
					/>
				}
				label={label}
			/>
			{endAdornment}
		</FormGroup>
	)
}
