import React, { useCallback } from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const IntInput: React.FC<
	| {
			currentValue: number
			indeterminate?: boolean
			onChange: (newValue: number) => void
			allowUndefined: false
			emptyPlaceholder?: string
			label: React.ReactNode
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			/** min, max */
			caps?: [number, number]
			endAdornment?: React.ReactNode
			tooltip?: string
			focusTooltip?: string
	  }
	| {
			currentValue: number | undefined
			indeterminate?: boolean
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			emptyPlaceholder?: string
			label: React.ReactNode
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			/** min, max */
			caps?: [number, number]
			endAdornment?: React.ReactNode
			tooltip?: string
			focusTooltip?: string
	  }
> = (props) => {
	const parse = useCallback(
		(str: string) => {
			let value: number | undefined = undefined

			const parsedValue = parseInt(`${str}`.replace(/\D/g, ''))
			if (!isNaN(parsedValue)) value = parsedValue

			if (value !== undefined && props.caps) value = Math.max(props.caps[0], Math.min(props.caps[1], value))
			return value
		},
		[props.caps]
	)
	const stringify = useCallback((value: number | undefined) => {
		if (value === undefined) return ''
		else return `${value}`
	}, [])
	const onIncrement = useCallback(
		(value: number | undefined, inc: number) => {
			value = Math.round((value ?? 0) + inc)

			if (props.caps) value = Math.max(props.caps[0], Math.min(props.caps[1], value))
			return value
		},
		[props.caps]
	)
	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.indeterminate,
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
			onIncrement,
			props.endAdornment,
			props.tooltip,
			props.focusTooltip
		)
	} else {
		return ParsedValueInput<number>(
			props.currentValue,
			props.indeterminate,
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
			onIncrement,
			props.endAdornment,
			props.tooltip,
			props.focusTooltip
		)
	}
}
