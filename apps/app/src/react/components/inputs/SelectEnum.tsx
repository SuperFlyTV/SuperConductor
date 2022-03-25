import { MenuItem, SxProps, TextField, Theme } from '@mui/material'
import React, { useState } from 'react'
import { ConfirmationDialog } from '../util/ConfirmationDialog'

type ConfirmationDialogProps =
	| {
			confirm?: false
	  }
	| {
			confirm: true
			confirmationTitle: string
			confirmationMessage: string | ((proposedOption: Option) => string)
			confirmationButtonLabel?: string
			onConfirmationAccept?: (proposedOption: Option) => void
			onConfirmationReject?: () => void
	  }

type SelectEnumProps = {
	label: string
	currentValue: any
	options: { [key: string]: any }
	onChange: (newValue: any) => void
	sx?: SxProps<Theme>
	allowUndefined?: boolean
	defaultValue?: any
	fullWidth?: boolean
} & ConfirmationDialogProps

type Option = { value: string | number; label: string }

export const SelectEnum: React.FC<SelectEnumProps> = ({
	currentValue,
	options,
	onChange,
	allowUndefined,
	defaultValue,
	label,
	fullWidth,
	...props
}) => {
	const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
	const [proposedOption, setProposedOption] = useState<Option>()
	const allOptions: { [key: string]: Option } = {}

	// Convert Typescript-enum to key-values:

	let foundAny = false
	// If the enum has numbers as values:
	for (const key in options) {
		if (!isNaN(Number(key))) {
			foundAny = true
			allOptions[key] = { value: Number(key), label: options[key] }
		}
	}
	if (!foundAny) {
		// If the enum has strings as values:
		for (const key in options) {
			if (isNaN(Number(key))) {
				foundAny = true
				allOptions[options[key]] = { value: options[key], label: key }
			}
		}
	}
	if (allowUndefined) {
		allOptions['__undefined'] = { value: '__undefined', label: 'Not set' }
	}
	if (currentValue === undefined) {
		if (defaultValue !== undefined) {
			currentValue = defaultValue
		} else {
			currentValue = '__undefined'
		}
	}

	if (!allOptions[currentValue]) {
		if (currentValue === '__undefined') {
			allOptions[currentValue] = { value: currentValue, label: 'Not set' }
		} else {
			allOptions[currentValue] = { value: currentValue, label: currentValue }
		}
	}

	return (
		<>
			<TextField
				select
				margin="dense"
				size="small"
				fullWidth={fullWidth}
				label={label}
				value={currentValue}
				sx={props.sx}
				onChange={(e) => {
					if (props.confirm) {
						setProposedOption(allOptions[e.target.value])
						setConfirmationDialogOpen(true)
					} else if (allowUndefined && e.target.value === '__undefined') {
						onChange(undefined)
					} else {
						const selectedOption = allOptions[e.target.value]
						if (selectedOption) onChange(selectedOption.value)
						else throw new Error('Unknown option: ' + e.target.value)
					}
				}}
			>
				{Object.entries(allOptions).map(([key, value]) => {
					return (
						<MenuItem key={key} value={key}>
							{value.label}
						</MenuItem>
					)
				})}
			</TextField>

			{props.confirm && (
				<ConfirmationDialog
					open={confirmationDialogOpen}
					title={props.confirmationTitle}
					body={
						typeof props.confirmationMessage === 'string'
							? props.confirmationMessage
							: typeof proposedOption === 'undefined'
							? 'Are you sure you wish to commit this change?'
							: props.confirmationMessage(proposedOption)
					}
					acceptLabel={props.confirmationButtonLabel ?? 'Confirm'}
					onAccepted={() => {
						if (proposedOption) {
							onChange(proposedOption.value)
							if (props.onConfirmationAccept) {
								props.onConfirmationAccept(proposedOption)
							}
						}
						setConfirmationDialogOpen(false)
					}}
					onDiscarded={() => {
						if (props.onConfirmationReject) {
							props.onConfirmationReject()
						}
						setConfirmationDialogOpen(false)
					}}
				/>
			)}
		</>
	)
}
