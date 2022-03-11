import React from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const IntInput: React.FC<
	| { currentValue: number; onChange: (newValue: number) => void; allowUndefined: false }
	| { currentValue: number | undefined; onChange: (newValue: number | undefined) => void; allowUndefined: true }
> = (props) => {
	const parse = (str: string) => {
		const parsedValue = parseInt(`${str}`.replace(/[\D]/g, ''))
		if (isNaN(parsedValue)) return undefined
		else return parsedValue
	}
	const stringify = (value: number | undefined) => {
		if (value === undefined) return ''
		else return `${value}`
	}
	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			parse,
			stringify,
			'number'
		)
	} else {
		return ParsedValueInput<number>(props.currentValue, props.onChange, 0, parse, stringify, 'number')
	}
}
