import { TextField } from '@mui/material'
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'

export function ParsedValueInput<V>(
	currentValue: V,
	onChange: (newValue: V) => void,
	defaultValue: V,
	parse: (str: string) => V | undefined,
	stringify: (val: V) => string,
	label?: string,
	emptyPlaceholder?: string,
	inputType: React.HTMLInputTypeAttribute = 'text',
	disabled?: boolean,
	fullWidth?: boolean,
	width?: string
): JSX.Element {
	const [value, setValue] = useState<string>('')
	const selectorPosition = useRef<number | null>(null)
	const fieldRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setValue(stringify(currentValue))
	}, [currentValue, stringify])

	const onSave = (str: string) => {
		if (!str) {
			onChange(defaultValue)
			setValue(stringify(currentValue))
		} else {
			const value = parse(str)
			if (value !== undefined) onChange(value)
			else setValue(stringify(currentValue)) // unable to parse, revert to previous value
		}
	}
	const onEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const str: string = e.target.value
		const v = parse(str)
		if (v !== undefined) {
			if (e.target.selectionStart !== null) {
				const addedLength = str.length - value.length
				// Handle a few special cases where we want to move the selector position:
				if (e.target.selectionStart === 0 || (addedLength === 1 && e.target.selectionStart === 1)) {
					selectorPosition.current = e.target.selectionStart
				}
			}
			setValue(stringify(v))
			return
		}
		selectorPosition.current = null
		setValue(str)
	}

	useEffect(() => {
		const input = fieldRef.current
		return () => {
			if (input && input.value) {
				const value = parse(input.value)
				if (value !== undefined && value !== currentValue) {
					onChange(value)
				}
			}
		}
	}, [fieldRef, currentValue, parse, onChange])

	useLayoutEffect(() => {
		// Move the selector position:
		if (selectorPosition.current !== null)
			fieldRef.current?.setSelectionRange(selectorPosition.current, selectorPosition.current)
		selectorPosition.current = null
	})

	return (
		<TextField
			type={inputType}
			inputRef={fieldRef}
			onBlur={(e) => {
				onSave(e.target.value)
			}}
			onChange={(e) => {
				onEventChange(e)
			}}
			onKeyDown={(e) => {
				const target = e.target as EventTarget & HTMLInputElement
				if (e.key === 'Enter') {
					;(document.activeElement as HTMLInputElement).blur()
					onSave(target.value)
				} else if (e.key === 'Escape') {
					// revert to previous value:
					setValue(stringify(currentValue))
				}
			}}
			size="small"
			fullWidth={fullWidth}
			margin="dense"
			label={label}
			value={value}
			disabled={disabled}
			placeholder={emptyPlaceholder}
			sx={{ width: width }}
		/>
	)
}
