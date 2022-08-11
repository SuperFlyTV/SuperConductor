import { TextField } from '@mui/material'
import _ from 'lodash'
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
	width?: string,
	changeOnKey?: boolean,
	onIncrement?: (value: V, increment: number) => V
): JSX.Element {
	const [value, setValue] = useState<string>('')
	const selectorPosition = useRef<number | null>(null)
	const fieldRef = useRef<HTMLInputElement>(null)
	const hasUnsavedChanges = useRef<boolean>(false)

	useEffect(() => {
		setValue(stringify(currentValue))
	}, [currentValue, stringify])

	const onSave = (str: string) => {
		hasUnsavedChanges.current = false

		if (!str) {
			onChange(defaultValue)
			setValue(stringify(currentValue))
		} else {
			const value = parse(str)
			if (value !== undefined) onChange(value)
			else setValue(stringify(currentValue)) // unable to parse, revert to previous value
		}
	}
	const onChangeValue = (value: V) => {
		setValue(stringify(value))
		onChange(value)
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
			if (input && input.value && hasUnsavedChanges.current) {
				const value = parse(input.value)
				if (value !== undefined && !_.isEqual(value, currentValue)) {
					onChange(value)
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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
				if (changeOnKey) {
					onEventChange(e)
					onSave(e.target.value)
				} else {
					setValue(e.target.value)
				}
			}}
			onKeyDown={(e) => {
				hasUnsavedChanges.current = true
				const target = e.target as EventTarget & HTMLInputElement
				if (e.key === 'Enter') {
					// Select all text
					;(document.activeElement as HTMLInputElement).setSelectionRange(0, target.value.length)

					onSave(target.value)
				} else if (e.key === 'Escape') {
					// revert to previous value:
					;(document.activeElement as HTMLInputElement).blur()
					setValue(stringify(currentValue))
				} else if (e.key === 'ArrowUp') {
					if (onIncrement) {
						if (e.ctrlKey) onChangeValue(onIncrement(currentValue, 100))
						else if (e.shiftKey) onChangeValue(onIncrement(currentValue, 10))
						else if (e.altKey) onChangeValue(onIncrement(currentValue, 0.1))
						else onChangeValue(onIncrement(currentValue, 1))
					}
				} else if (e.key === 'ArrowDown') {
					if (onIncrement) {
						if (e.ctrlKey) onChangeValue(onIncrement(currentValue, -100))
						else if (e.shiftKey) onChangeValue(onIncrement(currentValue, -10))
						else if (e.altKey) onChangeValue(onIncrement(currentValue, -0.1))
						else onChangeValue(onIncrement(currentValue, -1))
					}
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
