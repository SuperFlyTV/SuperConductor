import React from 'react'
import { formatDuration, parseDuration } from './lib'
import { ParsedValueInput } from './parsedValue'

export const DurationInput: React.FC<
	| {
			currentValue: number | undefined
			onChange: (newValue: number | undefined) => void
			allowUndefined: true
	  }
	| {
			currentValue: number
			onChange: (newValue: number) => void
			allowUndefined: false
	  }
> = (props) => {
	if (props.allowUndefined) {
		return ParsedValueInput<number | undefined>(
			props.currentValue,
			props.onChange,
			undefined,
			parseDuration,
			formatDuration
		)
	} else {
		return ParsedValueInput<number>(props.currentValue, props.onChange, 0, parseDuration, formatDuration)
	}
}
