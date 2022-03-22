import React from 'react'
import { formatDuration, parseDuration } from '../../../lib/timeLib'
import { ParsedValueInput } from './parsedValueInput'

export const DurationInput: React.FC<
	| {
			currentValue: number | undefined
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			label?: string
			disabled?: boolean
			fullWidth?: boolean
	  }
	| {
			currentValue: number
			onChange: (newValue: number) => void
			allowUndefined: false
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
			parseDuration,
			formatDuration,
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
			parseDuration,
			formatDuration,
			props.label,
			'text',
			props.disabled,
			props.fullWidth
		)
	}
}
