import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { useSnackbar } from 'notistack'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import classNames from 'classnames'

export const SidebarContent: React.FC<{
	title: string | React.ReactNode
	className: string
	children: React.ReactNode
}> = (props) => {
	const header = useRef<HTMLDivElement | null>()
	const content = useRef<HTMLDivElement | null>()

	const [headerHeight, setHeaderHeight] = React.useState<number | undefined>(undefined)

	useEffect(() => {
		if (header.current) {
			const height = header.current.offsetHeight

			setHeaderHeight(height)
		}
	})

	return (
		<div className={classNames('sidebar', props.className)}>
			<div
				className="sidebar__header"
				ref={(el) => {
					header.current = el
				}}
			>
				{typeof props.title === 'string' ? <span className="title">{props.title}</span> : props.title}
			</div>
			{headerHeight !== undefined && (
				<div className="sidebar__content" style={{ top: headerHeight }}>
					{props.children}
				</div>
			)}
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
