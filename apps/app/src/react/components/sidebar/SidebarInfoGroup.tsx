import classNames from 'classnames'
import React, { useCallback, useContext } from 'react'
import { HiRefresh } from 'react-icons/hi'
import { useSnackbar } from 'notistack'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { Button, ButtonGroup } from '@mui/material'

export const SidebarInfoGroup: React.FC<{
	title: string
	children: React.ReactNode
	enableRefresh?: boolean
	refreshActive?: boolean
	onRefreshClick?: () => Promise<void>
	refreshAutoInterval?: number
	onRefreshAutoClick?: (interval: number) => void
}> = (props) => {
	const { handleError } = useContext(ErrorHandlerContext)

	return (
		<div className="info-group">
			<div className="title">
				<span>{props.title}</span>
				{props.enableRefresh && (
					<ButtonGroup className="refresh-resources">
						<Button className={classNames('on-hover')} onClick={() => props.onRefreshAutoClick?.(0)}>
							Auto: Off
						</Button>
						<Button
							className={classNames('on-hover', { selected: props.refreshAutoInterval === 1000 })}
							onClick={() => props.onRefreshAutoClick?.(1000)}
						>
							1s
						</Button>
						<Button
							className={classNames('on-hover', { selected: props.refreshAutoInterval === 10000 })}
							onClick={() => props.onRefreshAutoClick?.(10000)}
						>
							10s
						</Button>
						<Button
							className={classNames('on-hover', { selected: props.refreshAutoInterval === 60000 })}
							onClick={() => props.onRefreshAutoClick?.(60000)}
						>
							1m
						</Button>

						<Button
							className={classNames('refresh', { active: props.refreshActive })}
							onClick={() => {
								if (props.onRefreshClick) props.onRefreshClick().catch(handleError)
							}}
						>
							<HiRefresh size={15} color="white" />
						</Button>
					</ButtonGroup>
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
