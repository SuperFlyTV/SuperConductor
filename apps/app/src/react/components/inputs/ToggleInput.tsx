import classNames from 'classnames'
import React from 'react'
import { Toggle } from 'react-toggle'

export const ToggleInput: React.FC<{
	currentValue: boolean | undefined
	indeterminate?: boolean
	onChange: (newValue: boolean) => void
	disabled?: boolean
	label?: string
	id?: string
}> = ({ currentValue, indeterminate, onChange, disabled, label, id }) => {
	return (
		<Toggle
			id={id}
			onChange={(e) => {
				if (indeterminate) onChange(true)
				else onChange(e.target.checked)
			}}
			checked={indeterminate ? false : !!currentValue}
			disabled={disabled}
			title={label}
			className={classNames({
				indeterminate,
			})}
		/>
	)
}
