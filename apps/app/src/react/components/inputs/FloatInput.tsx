import React, { useCallback } from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const FloatInput: React.FC<
	| {
			currentValue: number
			onChange: (newValue: number) => void
			allowUndefined: false
			emptyPlaceholder?: string
			label: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			percentage?: boolean
			/** min, max */
			caps?: [number, number]
	  }
	| {
			currentValue: number | undefined
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			emptyPlaceholder?: string
			label: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			percentage?: boolean
			/** min, max */
			caps?: [number, number]
	  }
> = (props) => {
	const parse = useCallback(
		(str: string) => {
			str = `${str}`.replace(/,/, '.')

			let value: number | undefined = undefined
			if (str.match(/^\d+(\.\d+)?$/)) {
				// 100.0
				const parsedValue = parseFloat(str)
				if (!isNaN(parsedValue)) {
					value = parsedValue
					if (props.percentage) value /= 100
				}
			} else if (str.match(/^\d+(\.\d+)?%$/)) {
				// 100.0%
				const parsedValue = parseFloat(str)
				if (!isNaN(parsedValue)) value = parsedValue / 100
			} else if (str.match(/^[\d\.\/\+\-\/\*]+$/)) {
				// Expressions: 1/127

				let parsedValue: number | undefined
				try {
					parsedValue = eval(str)
				} catch (_) {
					parsedValue = undefined
				}
				if (parsedValue !== undefined && !isNaN(parsedValue)) value = parsedValue
			}
			if (value !== undefined && props.caps) value = Math.max(props.caps[0], Math.min(props.caps[1], value))
			return value
		},
		[props.caps, props.percentage]
	)
	const stringify = useCallback(
		(value: number | undefined) => {
			if (value === undefined) return ''

			value = Math.round(value * 100000) / 100000 // fix any rounding errors

			if (props.percentage) {
				return `${value * 100}%`
			} else {
				return `${value}`
			}
		},
		[props.percentage]
	)
	const onIncrement = useCallback(
		(value: number | undefined, inc: number) => {
			if (props.percentage) {
				value = (value ?? 0) + inc / 100
			} else {
				value = (value ?? 0) + inc
			}
			if (props.caps) value = Math.max(props.caps[0], Math.min(props.caps[1], value))
			return value
		},
		[props.caps, props.percentage]
	)
	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			parse,
			stringify,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			props.changeOnKey,
			onIncrement
		)
	} else {
		return ParsedValueInput<number>(
			props.currentValue,
			props.onChange,
			0,
			parse,
			stringify,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			props.changeOnKey,
			onIncrement
		)
	}
}
