import React, { useCallback } from 'react'
import { ParsedValueInput } from './parsedValueInput.js'
export const TextInput: React.FC<
	| {
			currentValue: string
			indeterminate?: boolean
			onChange: (newValue: string) => void
			allowUndefined: false
			emptyPlaceholder?: string
			label?: React.ReactNode
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			endAdornment?: React.ReactNode
			tooltip?: string
			focusTooltip?: string
	  }
	| {
			currentValue: string | undefined
			indeterminate?: boolean
			onChange: (newValue: string | undefined) => void
			allowUndefined: true
			emptyPlaceholder?: string
			label?: React.ReactNode
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			endAdornment?: React.ReactNode
			tooltip?: string
			focusTooltip?: string
	  }
> = (props) => {
	const parse = useCallback((v: string) => v, [])

	const stringify = useCallback((v: string | undefined) => v ?? '', [])

	if (props.allowUndefined) {
		return ParsedValueInput<string | undefined>(
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
			undefined,
			props.endAdornment,
			props.tooltip,
			props.focusTooltip
		)
	} else {
		return ParsedValueInput<string>(
			props.currentValue,
			props.indeterminate,
			props.onChange,
			'',
			parse,
			stringify,
			props.label,
			props.emptyPlaceholder,
			'text',
			props.disabled,
			props.fullWidth,
			props.width,
			props.changeOnKey,
			undefined,
			props.endAdornment,
			props.tooltip,
			props.focusTooltip
		)
	}
}
