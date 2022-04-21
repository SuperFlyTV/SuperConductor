import classNames from 'classnames'
import React, { useCallback, useContext } from 'react'
import { HiRefresh } from 'react-icons/hi'
import { useSnackbar } from 'notistack'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'

export const SidebarInfoGroup: React.FC<{
	title: string
	children: React.ReactNode
	enableRefresh?: boolean
	refreshActive?: boolean
	onRefreshClick?: () => Promise<void>
}> = (props) => {
	const { handleError } = useContext(ErrorHandlerContext)

	return (
		<div className="info-group">
			<div className="title">
				<span>{props.title}</span>
				{props.enableRefresh && (
					<button
						className={classNames({ refresh: true, active: props.refreshActive })}
						onClick={() => {
							if (props.onRefreshClick) props.onRefreshClick().catch(handleError)
						}}
					>
						<HiRefresh size={15} color="white" />
					</button>
				)}
			</div>
			<div className="content">{props.children}</div>
		</div>
	)
}

export const DataRow = (props: { label: string; value: any }) => {
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
		<div className="row">
			<div className="label" title={props.label}>
				{props.label}
			</div>
			<div className="value" title={`${props.value} (Click to copy)`} onClick={copyValueToClipboard}>
				{props.value}
			</div>
		</div>
	)
}

export const FormRow = (props: { children: React.ReactNode }) => {
	return <div className="row">{props.children}</div>
}
