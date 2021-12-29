import React from 'react'
import { ParsedValueInput } from './parsedValue'
export const TextInput: React.FC<
	| { currentValue: string; onChange: (newValue: string) => void; allowUndefined: false }
	| { currentValue: string | undefined; onChange: (newValue: string | undefined) => void; allowUndefined: true }
> = (props) => {
	if (props.allowUndefined) {
		return ParsedValueInput<string | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			(v) => v,
			(v) => v || ''
		)
	} else {
		return ParsedValueInput<string>(
			props.currentValue,
			props.onChange,
			'',
			(v) => v,
			(v) => v || ''
		)
	}
}
