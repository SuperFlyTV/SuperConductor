import _ from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { ParsedValueInput } from './parsedValueInput'
export const TextArrayInput: React.FC<
	| {
			currentValue: string[]
			onChange: (newValue: string[]) => void
			delimiter: string | RegExp
			allowUndefined: false
			emptyPlaceholder?: string
			label?: React.ReactNode
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			endAdornment?: React.ReactNode
	  }
	| {
			currentValue: string[] | undefined
			onChange: (newValue: string[] | undefined) => void
			delimiter: string | RegExp
			allowUndefined: true
			emptyPlaceholder?: string
			label?: React.ReactNode
			disabled?: boolean
			fullWidth?: boolean
			width?: string
			changeOnKey?: boolean
			endAdornment?: React.ReactNode
	  }
> = (props) => {
	const { delimiter, mainDelimiter } = useMemo(() => {
		let delimiter = props.delimiter
		if (!delimiter) delimiter = ' '

		if (typeof delimiter === 'string' && delimiter.length > 1) {
			delimiter = new RegExp(`[${_.escapeRegExp(delimiter)}]`)
		}

		let mainDelimiter: string
		if (delimiter instanceof RegExp) {
			const m = ' ,.;:/\\|'.match(delimiter)
			if (m) mainDelimiter = m[0][0]
			else mainDelimiter = ' ' // fallback
		} else {
			mainDelimiter = delimiter[0]
		}
		return { delimiter, mainDelimiter }
	}, [props.delimiter])

	const parse = useCallback(
		(v: string): string[] => {
			if (!v) return []
			return v.split(delimiter)
		},
		[delimiter]
	)

	const stringify = useCallback(
		(v: string[] | undefined): string => {
			if (!v) return ''
			if (v.length === 0) return ''
			return v.join(mainDelimiter)
		},
		[mainDelimiter]
	)

	if (props.allowUndefined) {
		return ParsedValueInput<string[] | undefined>(
			props.currentValue,
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
			props.endAdornment
		)
	} else {
		return ParsedValueInput<string[]>(
			props.currentValue,
			props.onChange,
			[],
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
			props.endAdornment
		)
	}
}
