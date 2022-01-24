import React from 'react'

export const SelectEnum: React.FC<{
	currentValue: any
	options: { [key: string]: any }
	onChange: (newValue: any) => void
	allowUndefined?: boolean
	defaultValue?: any
}> = ({ currentValue, options, onChange, allowUndefined, defaultValue }) => {
	const allOptions: { [key: string]: { value: string | number; label: string } } = {}

	// Convert Typescript-enum to key-values:

	let foundAny = false
	// If the enum has numbers as values:
	for (const key in options) {
		if (!isNaN(Number(key))) {
			foundAny = true
			allOptions[key] = { value: Number(key), label: options[key] }
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
	if (allowUndefined) {
		allOptions['__undefined'] = { value: '__undefined', label: 'Not set' }
	}
	if (currentValue === undefined) {
		if (defaultValue !== undefined) {
			currentValue = defaultValue
		} else {
			currentValue = '__undefined'
		}
	}

	if (!allOptions[currentValue]) {
		if (currentValue === '__undefined') {
			allOptions[currentValue] = { value: currentValue, label: 'Not set' }
		} else {
			allOptions[currentValue] = { value: currentValue, label: currentValue }
		}
	}

	return (
		<select
			value={currentValue}
			onChange={(e) => {
				if (allowUndefined && e.target.value === '__undefined') {
					onChange(undefined)
				} else {
					const selectedOption = allOptions[e.target.value]
					if (selectedOption) onChange(selectedOption.value)
					else throw new Error('Unknown option: ' + e.target.value)
				}
			}}
		>
			{Object.entries(allOptions).map(([key, value]) => {
				return (
					<option key={key} value={key}>
						{value.label}
					</option>
				)
			})}
		</select>
	)
}
