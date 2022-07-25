import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import React from 'react'

export interface SelectEnumMultipleProps<T extends string | number> {
	label: string
	currentValues: T[]
	options: { [key: string]: T } | { value: T; label: string }[]
	onChange: (newValue: T[]) => void
	allowUndefined?: boolean
	fullWidth?: boolean
	width?: string
	disabled?: boolean
}

export const SelectEnumMultiple: React.FC<SelectEnumMultipleProps<string> | SelectEnumMultipleProps<number>> = ({
	currentValues,
	options,
	onChange,
	allowUndefined,
	label,
	fullWidth,
	width,
	disabled,
}) => {
	const allOptions: { [key: string]: { value: string | number; label: string } } = {}

	// Convert Typescript-enum to key-values:

	if (Array.isArray(options)) {
		for (const o of options) {
			allOptions[o.value] = { value: o.value, label: o.label }
		}
	} else {
		let foundAny = false
		// If the enum has numbers as values:
		for (const key in options) {
			if (!isNaN(Number(key))) {
				foundAny = true
				allOptions[key] = { value: Number(key), label: `${options[key] || key}` }
			}
		}
		if (!foundAny) {
			// If the enum has strings as values:
			for (const key in options) {
				if (isNaN(Number(key))) {
					foundAny = true
					allOptions[options[key]] = { value: options[key], label: key }
				}
			}
		}
	}
	if (allowUndefined) {
		allOptions['__undefined'] = { value: '__undefined', label: 'Not set' }
	}

	// ensure that the current values are in the list of options:
	for (const v of currentValues) {
		if (!allOptions[v]) {
			if (v === '__undefined') {
				allOptions[v] = { value: v, label: 'Not set' }
			} else {
				allOptions[v] = { value: v, label: `${v}` }
			}
		}
	}

	return (
		<FormControl sx={{ m: 0, width: 300 }}>
			<InputLabel>{label}</InputLabel>
			<Select
				margin="dense"
				size="small"
				fullWidth={fullWidth}
				label={label}
				value={currentValues}
				multiple={true}
				onChange={(event: SelectChangeEvent<any>) => {
					onChange(event.target.value)
				}}
				sx={{ width: width }}
				disabled={disabled}
			>
				{Object.entries(allOptions).map(([key, value]) => {
					return (
						<MenuItem key={key} value={key}>
							{value.label}
						</MenuItem>
					)
				})}
			</Select>
		</FormControl>
	)
}
