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
			false,
			onIncrement
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
			false,
			onIncrement
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
			false,
			onIncrement
		)
	}
}

function onIncrement(
	value: DateTimeObject | undefined,
	increment: number,
	str: string,
	cursorStart: number | undefined,
	cursorEnd: number | undefined
): DateTimeObject | undefined
function onIncrement(
	value: DateTimeObject | null,
	increment: number,
	str: string,
	cursorStart: number | undefined,
	cursorEnd: number | undefined
): DateTimeObject | null
function onIncrement(
	value: DateTimeObject,
	increment: number,
	str: string,
	cursorStart: number | undefined,
	cursorEnd: number | undefined
): DateTimeObject
function onIncrement(
	value: DateTimeObject | null | undefined,
	increment: number,
	str: string,
	cursorStart: number | undefined,
	_cursorEnd: number | undefined
): DateTimeObject | null | undefined {
	// Increment the selected value
	if (cursorStart !== undefined) {
		const matchBefore = str.slice(0, cursorStart).match(/(.*?)(\d*)$/) ?? []
		const matchAfter = str.slice(cursorStart).match(/^(\d*)(.*)/) ?? []

		const before = matchBefore[1] ?? ''
		let num = Number((matchBefore[2] ?? '') + (matchAfter[1] ?? ''))
		const after = matchAfter[2] ?? ''

		if (!Number.isNaN(num)) {
			num += increment
			const newStr = before + num + after

			const newValue = parseDateTime(newStr)
			if (newValue) return newValue
		}
	}

	return value
}
