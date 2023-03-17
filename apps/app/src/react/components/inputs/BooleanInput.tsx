import { Checkbox, FormControlLabel, FormGroup, Tooltip } from '@mui/material'
import React from 'react'

export const BooleanInput: React.FC<{
	currentValue: boolean | undefined
	onChange: (newValue: boolean) => void
	label: string | number | React.ReactElement<any, string | React.JSXElementConstructor<any>>
	disabled?: boolean
	indeterminate?: boolean
	endAdornment?: React.ReactNode
	tooltip?: string
}> = ({ currentValue, onChange, label, disabled, indeterminate, endAdornment, tooltip }) => {
	let elInput = (
		<Checkbox
			onChange={(e) => {
				onChange(e.target.checked)
			}}
			checked={!!currentValue}
			disabled={disabled}
			indeterminate={indeterminate}
		/>
	)

	if (tooltip) {
		const displayTooltip = tooltip ?? ''

		elInput = (
			<Tooltip arrow={true} title={displayTooltip}>
				{elInput}
			</Tooltip>
		)
	}

	return (
		<FormGroup>
			<FormControlLabel control={elInput} label={label} />
			{endAdornment}
		</FormGroup>
	)
}
