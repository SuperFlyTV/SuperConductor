import React from 'react'

export function ParsedValueInput<V>(
	currentValue: V,
	onChange: (newValue: V) => void,
	defaultValue: V,
	parse: (str: string) => V | undefined,
	stringify: (val: V) => string,
	inputType: React.HTMLInputTypeAttribute = 'text'
): JSX.Element {
	const [value, setValue] = React.useState<string>('')
	React.useEffect(() => {
		setValue(stringify(currentValue))
	}, [currentValue])

	const onSave = (str: string) => {
		if (!str) {
			onChange(defaultValue)
		} else {
			const value = parse(str)
			if (value !== undefined) onChange(value)
			else setValue(stringify(currentValue)) // unable to parse, revert to previous value
		}
	}
	const onEventChange = (str: string) => {
		if (str.length > value.length) {
			const v = parse(str)
			if (v !== undefined) {
				setValue(stringify(v))
				return
			}
		}
		setValue(str)
	}

	return (
		<input
			type={inputType}
			onBlur={(e) => {
				onSave(e.target.value)
			}}
			onChange={(e) => {
				onEventChange(e.target.value)
			}}
			onKeyDown={(e) => {
				const target = e.target as EventTarget & HTMLInputElement
				if (e.code === 'Enter') {
					onSave(target.value)
				} else if (e.code === 'Escape') {
					// revert to previous value:
					setValue(stringify(currentValue))
				}
			}}
			value={value}
		/>
	)
}