import React from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const TextInput: React.FC<
	| { currentValue: string; onChange: (newValue: string) => void; allowUndefined: false; label?: string }
	| {
			currentValue: string | undefined
			onChange: (newValue: string | undefined) => void
			allowUndefined: true
			label?: string
	  }
> = (props) => {
	if (props.allowUndefined) {
		return ParsedValueInput<string | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			(v) => v,
			(v) => v || '',
			props.label
		)
	} else {
		return ParsedValueInput<string>(
			props.currentValue,
			props.onChange,
			'',
			(v) => v,
			(v) => v || '',
			props.label
		)
	}
}
