import React, { useCallback } from 'react'
import { ParsedValueInput } from './parsedValueInput.js'

export const PercentageInput: React.FC<
	(
		| {
				currentValue: number | undefined
				onChange: (newValue: number | undefined) => void
				allowUndefined: true
		  }
		| {
				currentValue: number
				onChange: (newValue: number) => void
				allowUndefined: false
				defaultValue: number
		  }
	) & {
		indeterminate?: boolean
		emptyPlaceholder?: string
		label?: React.ReactNode
		focusTooltip?: string
		disabled?: boolean
		fullWidth?: boolean
		width?: string
		tooltip?: string
		endAdornment?: React.ReactNode
	}
> = (props) => {
	const onIncrement = useCallback((value: number | undefined | null, inc: number) => {
		value = (value ?? 0) + inc / 100
		value = Math.round(value * 100000) / 100000 // fix any rounding errors
		value = Math.max(0, value)
		return value
	}, [])

	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.indeterminate,
			props.onChange,
			undefined,
			(str: string) => parsePercentage(str) ?? undefined,
			formatPercentage,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			undefined,
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
			props.defaultValue,
			(str: string) => parsePercentage(str) ?? undefined,
			formatPercentage,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			undefined,
			onIncrement,
			props.endAdornment,
			props.tooltip,
			props.focusTooltip
		)
	}
}

function parsePercentage(str: string): number | undefined {
	str = str + ''
	if (str === '') return undefined
	str = str.replace(/,/, '.')
	const m = str.match(/([\d,.]+)/)
	if (m) {
		const percentage = parseFloat(m[1])
		if (!Number.isNaN(percentage)) {
			return percentage / 100
		}
	}

	return 0
}
function formatPercentage(inputValue: number | undefined): string {
	if (inputValue === undefined) return ''

	const percentage = Math.round(inputValue * 100 * 100000) / 100000 // fix any rounding errors
	return `${percentage}%`
}
