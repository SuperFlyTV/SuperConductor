import React from 'react'
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
	  }
> = (props) => {
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
			props.fullWidth
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
			props.fullWidth
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
			props.fullWidth
		)
	}
}
