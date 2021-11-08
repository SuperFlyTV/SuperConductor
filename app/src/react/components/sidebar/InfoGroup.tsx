import classNames from 'classnames'
import React from 'react'
import { HiRefresh } from 'react-icons/hi'

interface InfoGroupProps {
	title: string
	children: React.ReactNode
	enableRefresh?: boolean
	refreshActive?: boolean
	onRefreshClick?: () => void
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
							if (props.onRefreshClick) props.onRefreshClick()
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
