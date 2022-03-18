import React, { useCallback } from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const TextInput: React.FC<
	| {
			currentValue: string
			onChange: (newValue: string) => void
			allowUndefined: false
			label?: string
			disabled?: boolean
	  }
	| {
			currentValue: string | undefined
			onChange: (newValue: string | undefined) => void
			allowUndefined: true
			label?: string
			disabled?: boolean
	  }
> = (props) => {
	const parse = useCallback((v: string) => v, [])

	const stringify = useCallback((v: string | undefined) => v ?? '', [])

	if (props.allowUndefined) {
		return ParsedValueInput<string | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			parse,
			stringify,
			props.label,
			'text',
			props.disabled
		)
	} else {
		return ParsedValueInput<string>(
			props.currentValue,
			props.onChange,
			'',
			parse,
			stringify,
			props.label,
			'text',
			props.disabled
		)
	}
}
