import classNames from 'classnames'
import React, { useContext } from 'react'
import { HiRefresh } from 'react-icons/hi'
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
	return (
		<div className="row">
			<div className="label" title={props.label}>
				{props.label}
			</div>
			<div className="value" title={props.value}>
				{props.value}
			</div>
		</div>
	)
}

export const FormRow = (props: { children: React.ReactNode }) => {
	return <div className="row">{props.children}</div>
}
