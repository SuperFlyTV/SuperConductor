import React, { useCallback } from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const IntInput: React.FC<
	| {
			currentValue: number
			onChange: (newValue: number) => void
			allowUndefined: false
			label: string
			disabled?: boolean
			fullWidth?: boolean
	  }
	| {
			currentValue: number | undefined
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			label: string
			disabled?: boolean
			fullWidth?: boolean
	  }
> = (props) => {
	const parse = useCallback((str: string) => {
		const parsedValue = parseInt(`${str}`.replace(/[\D]/g, ''))
		if (isNaN(parsedValue)) return undefined
		else return parsedValue
	}, [])
	const stringify = useCallback((value: number | undefined) => {
		if (value === undefined) return ''
		else return `${value}`
	}, [])
	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			parse,
			stringify,
			props.label,
			'text',
			props.disabled,
			props.fullWidth
		)
	} else {
		return ParsedValueInput<number>(
			props.currentValue,
			props.onChange,
			0,
			parse,
			stringify,
			props.label,
			'text',
			props.disabled,
			props.fullWidth
		)
	}
}
