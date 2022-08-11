import React from 'react'
import { DateTimeObject, formatDateTime, parseDateTime } from '../../../lib/timeLib'
import { ParsedValueInput } from './parsedValueInput'

export const DateTimeInput: React.FC<
	| {
			currentValue: DateTimeObject | undefined
			onChange: (newValue: DateTimeObject | undefined) => void
			allowUndefined: true
			emptyPlaceholder?: string
			label?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
	  }
	| {
			currentValue: DateTimeObject
			onChange: (newValue: DateTimeObject) => void
			allowUndefined: false
			allowNull: false
			emptyPlaceholder?: string
			defaultValue: DateTimeObject
			label?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
	  }
	| {
			currentValue: DateTimeObject | null
			onChange: (newValue: DateTimeObject | null) => void
			allowUndefined: false
			allowNull: true
			emptyPlaceholder?: string
			defaultValue: DateTimeObject | null
			label?: string
			disabled?: boolean
			fullWidth?: boolean
			width?: string
	  }
> = (props) => {
	if (props.allowUndefined) {
		return ParsedValueInput<DateTimeObject | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			(str: string) => parseDateTime(str) ?? undefined,
			formatDateTime,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			false
		)
	} else if (props.allowNull) {
		return ParsedValueInput<DateTimeObject | null>(
			props.currentValue,
			props.onChange,
			props.defaultValue,
			parseDateTime,
			formatDateTime,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			false
		)
	} else {
		return ParsedValueInput<DateTimeObject>(
			props.currentValue,
			props.onChange,
			props.defaultValue,
			(str: string) => parseDateTime(str) ?? undefined,
			formatDateTime,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			false
		)
	}
}
