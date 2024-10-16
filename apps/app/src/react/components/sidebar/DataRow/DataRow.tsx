/* eslint-disable n/no-unsupported-features/node-builtins */
import React, { useCallback, useContext } from 'react'
import { useSnackbar } from 'notistack'
import { Tooltip } from '@mui/material'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler.js'

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
			<Tooltip title={`Click to copy`}>
				<div
					className="value copy-to-clipboard"
					onClick={() => {
						void copyValueToClipboard()
					}}
				>
					{props.value}
				</div>
			</Tooltip>
		</div>
	)
}

export const FormRow = (props: { children: React.ReactNode }): JSX.Element => {
	return <div className="row">{props.children}</div>
}
