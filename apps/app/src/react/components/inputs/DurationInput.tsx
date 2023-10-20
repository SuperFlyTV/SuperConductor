import React, { useCallback } from 'react'
import { formatDuration, parseDuration } from '../../../lib/timeLib'
import { ParsedValueInput } from './parsedValueInput'

export const DurationInput: React.FC<
	| {
			currentValue: number | undefined
			indeterminate?: boolean
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			emptyPlaceholder?: string
			label?: React.ReactNode
			focusTooltip?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			tooltip?: string
			endAdornment?: React.ReactNode
	  }
	| {
			currentValue: number
			indeterminate?: boolean
			onChange: (newValue: number) => void
			allowUndefined: false
			allowNull: false
			emptyPlaceholder?: string
			defaultValue: number
			label?: React.ReactNode
			focusTooltip?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			tooltip?: string
			endAdornment?: React.ReactNode
	  }
	| {
			currentValue: number | null
			indeterminate?: boolean
			onChange: (newValue: number | null) => void
			allowUndefined: false
			allowNull: true
			emptyPlaceholder?: string
			defaultValue: number | null
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
		if (inc === 10) inc = 10
		else if (inc === -10) inc = -10
		else if (inc === 100) inc = 60
		else if (inc === -100) inc = -60
		else if (inc === 0.1) inc = 1 / 25
		else if (inc === -0.1) inc = -1 / 25

		value = (value ?? 0) + inc * 1000

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
			(str: string) => parseDuration(str) ?? undefined,
			formatDuration,
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
	} else if (props.allowNull) {
		return ParsedValueInput<number | null>(
			props.currentValue,
			props.indeterminate,
			props.onChange,
			props.defaultValue,
			parseDuration,
			formatDuration,
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
			(str: string) => parseDuration(str) ?? undefined,
			formatDuration,
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
