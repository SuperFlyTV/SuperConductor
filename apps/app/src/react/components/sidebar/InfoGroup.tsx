import classNames from 'classnames'
import React from 'react'
import { HiRefresh } from 'react-icons/hi'

interface InfoGroupProps {
	title: string
	children: React.ReactNode
	enableRefresh?: boolean
	refreshActive?: boolean
	onRefreshClick?: () => Promise<void>
}

export const InfoGroup = (props: InfoGroupProps) => {
	return (
		<div className="info-group">
			<div className="title">
				<span>{props.title}</span>
				{props.enableRefresh && (
					<button
						className={classNames({ refresh: true, active: props.refreshActive })}
						onClick={() => {
							if (props.onRefreshClick) props.onRefreshClick().catch(console.error)
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
