import React, { useCallback } from 'react'
import { formatDuration, parseDuration } from '../../../lib/timeLib'
import { ParsedValueInput } from './parsedValueInput'

export const DurationInput: React.FC<
	| {
			currentValue: number | undefined
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			emptyPlaceholder?: string
			label?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
	  }
	| {
			currentValue: number
			onChange: (newValue: number) => void
			allowUndefined: false
			allowNull: false
			emptyPlaceholder?: string
			defaultValue: number
			label?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
	  }
	| {
			currentValue: number | null
			onChange: (newValue: number | null) => void
			allowUndefined: false
			allowNull: true
			emptyPlaceholder?: string
			defaultValue: number | null
			label?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
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
			onIncrement
		)
	} else if (props.allowNull) {
		return ParsedValueInput<number | null>(
			props.currentValue,
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
			onIncrement
		)
	} else {
		return ParsedValueInput<number>(
			props.currentValue,
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
			onIncrement
		)
	}
}
