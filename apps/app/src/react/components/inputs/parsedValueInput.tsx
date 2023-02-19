import { FormControl, InputLabel, OutlinedInput, Tooltip } from '@mui/material'
import useId from '@mui/material/utils/useId'
import _ from 'lodash'
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'

export function ParsedValueInput<V>(
	currentValue: V,
	onChange: (newValue: V) => void,
	defaultValue: V,
	parse: (str: string, isWriting: boolean) => V | undefined,
	stringify: (val: V) => string,
	label?: React.ReactNode,
	emptyPlaceholder?: string,
	inputType: React.HTMLInputTypeAttribute = 'text',
	disabled?: boolean,
	fullWidth?: boolean,
	width?: string,
	changeOnKey?: boolean,
	onIncrement?: (
		value: V,
		increment: number,
		str: string,
		cursorStart: number | undefined,
		cursorEnd: number | undefined
	) => V,
	endAdornment?: React.ReactNode,
	/** Display a tooltip on hover */
	tooltip?: string,
	/** Display a tooltip when typing / focused */
	focusTooltip?: string
): JSX.Element {
	const inputId = useId()
	const [value, setValue] = useState<string>('')
	const [hasFocus, setHasFocus] = useState<boolean>(false)
	const selectorPosition = useRef<number | null>(null)
	const fieldRef = useRef<HTMLInputElement>(null)
	const hasUnsavedChanges = useRef<boolean>(false)

	useEffect(() => {
		let newValue: string
		if (currentValue === undefined && defaultValue !== undefined) {
			newValue = stringify(defaultValue)
		} else {
			newValue = stringify(currentValue)
		}
		setValue(newValue)
	}, [currentValue, defaultValue, stringify])

	const onSave = useCallback(
		(str: string) => {
			hasUnsavedChanges.current = false

			if (!str) {
				onChange(defaultValue)
				setValue(stringify(currentValue))
			} else {
				const value = parse(str, false)
				if (value !== undefined) onChange(value)
				else setValue(stringify(currentValue)) // unable to parse, revert to previous value
			}
		},
		[onChange, currentValue, defaultValue, parse, stringify]
	)
	const onChangeValue = useCallback(
		(value: V) => {
			setValue(stringify(value))
			onChange(value)
		},
		[stringify, onChange]
	)

	const onEventChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const str: string = e.target.value
			const v = parse(str, true)
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
		},
		[parse, stringify, value.length]
	)

	useEffect(() => {
		const input = fieldRef.current
		return () => {
			if (input && input.value && hasUnsavedChanges.current) {
				const value = parse(input.value, false)
				if (value !== undefined && !_.isEqual(value, currentValue)) {
					onChange(value)
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useLayoutEffect(() => {
		// Move the selector position:
		if (selectorPosition.current !== null) {
			const pos = selectorPosition.current
			fieldRef.current?.setSelectionRange(pos, pos)
			// Also set it in a bit, because the selection is also reset after the next render:
			setTimeout(() => {
				fieldRef.current?.setSelectionRange(pos, pos)
			}, 1)
		}
		selectorPosition.current = null
	}, [value])

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			const target = e.target as EventTarget & HTMLInputElement

			// @ts-expect-error selectionStart not found
			const selectionStart: number = target.selectionStart
			// @ts-expect-error selectionStart not found
			const selectionEnd: number = target.selectionEnd

			const str = target.value

			hasUnsavedChanges.current = true

			let incrementValue: number | undefined = undefined
			if (e.key === 'Enter') {
				// Select all text
				;(document.activeElement as HTMLInputElement).setSelectionRange(0, target.value.length)

				onSave(target.value)
			} else if (e.key === 'Escape') {
				// revert to previous value:
				;(document.activeElement as HTMLInputElement).blur()
				setValue(stringify(currentValue))
			} else if (e.key === 'ArrowUp') {
				if (e.ctrlKey) incrementValue = 100
				else if (e.shiftKey) incrementValue = 10
				else if (e.altKey) incrementValue = 0.1
				else incrementValue = 1
			} else if (e.key === 'ArrowDown') {
				if (e.ctrlKey) incrementValue = -100
				else if (e.shiftKey) incrementValue = -10
				else if (e.altKey) incrementValue = -0.1
				else incrementValue = -1
			}
			if (onIncrement && incrementValue !== undefined) {
				onChangeValue(onIncrement(currentValue, incrementValue, str, selectionStart, selectionEnd))
				selectorPosition.current = selectionStart
				// ;(document.activeElement as HTMLInputElement).setSelectionRange(selectionStart, selectionEnd)
			}
		},
		[onSave, onIncrement, onChangeValue, currentValue, stringify]
	)

	const onInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (changeOnKey) {
				onEventChange(e)
				onSave(e.target.value)
			} else {
				setValue(e.target.value)
			}
		},
		[onEventChange, onSave, changeOnKey]
	)

	const onFocus = useCallback(() => {
		setHasFocus(true)
	}, [setHasFocus])
	const onBlur = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			onSave(e.target.value)
			setHasFocus(false)
		},
		[onSave, setHasFocus]
	)

	let elInput = (
		<OutlinedInput
			id={inputId}
			type={inputType}
			inputRef={fieldRef}
			onFocus={onFocus}
			onBlur={onBlur}
			onChange={onInputChange}
			onKeyDown={onKeyDown}
			label={label}
			value={value}
			disabled={disabled}
			placeholder={emptyPlaceholder}
			endAdornment={endAdornment}
		/>
	)
	if (tooltip || focusTooltip) {
		let displayTooltip = tooltip ?? ''
		if (focusTooltip && hasFocus) displayTooltip = focusTooltip

		elInput = (
			<Tooltip arrow={true} title={displayTooltip} open={displayTooltip !== ''}>
				{elInput}
			</Tooltip>
		)
	}

	return (
		<FormControl variant="outlined" margin="dense" size="small" fullWidth={fullWidth} sx={{ width: width }}>
			<InputLabel htmlFor={inputId}>{label}</InputLabel>
			{elInput}
		</FormControl>
	)
}
