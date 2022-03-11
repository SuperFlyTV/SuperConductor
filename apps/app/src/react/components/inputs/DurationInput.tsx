import React from 'react'
import { formatDuration, parseDuration } from '../timelineObj/input/lib'
import { ParsedValueInput } from './parsedValueInput'

export const DurationInput: React.FC<
	| {
			currentValue: number | undefined
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
			label?: string
	  }
	| {
			currentValue: number
			onChange: (newValue: number) => void
			allowUndefined: false
			label?: string
	  }
> = (props) => {
	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			parseDuration,
			formatDuration,
			props.label
		)
	} else {
		return ParsedValueInput<number>(
			props.currentValue,
			props.onChange,
			0,
			parseDuration,
			formatDuration,
			props.label
		)
	}
}
