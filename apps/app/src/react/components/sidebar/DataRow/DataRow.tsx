import React, { useCallback, useContext } from 'react'
import { useSnackbar } from 'notistack'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'

import './style.scss'

export const DataRow = (props: { label: string; value: any }): JSX.Element => {
	const { handleError } = useContext(ErrorHandlerContext)
	const { enqueueSnackbar } = useSnackbar()

	const copyValueToClipboard = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(props.value)
			enqueueSnackbar(`Value copied to clipboard.`, { variant: 'success' })
		} catch (error) {
			handleError(error)
		}
	}, [enqueueSnackbar, handleError, props.value])

	return (
		<div className="row data-row">
			<div className="label" title={props.label}>
				{props.label}
			</div>
			<div
				className="value copy-to-clipboard"
				title={`${props.value} (Click to copy)`}
				onClick={() => {
					void copyValueToClipboard()
				}}
			>
				{props.value}
			</div>
		</div>
	)
}

export const FormRow = (props: { children: React.ReactNode }): JSX.Element => {
	return <div className="row">{props.children}</div>
}
