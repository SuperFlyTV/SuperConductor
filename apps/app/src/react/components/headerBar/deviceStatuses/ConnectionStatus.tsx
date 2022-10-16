import React, { MouseEventHandler } from 'react'
import classNames from 'classnames'

export const ConnectionStatus: React.FC<{
	ok?: boolean
	tooltip?: string
	label?: string
	children?: React.ReactNode
	onClick?: MouseEventHandler<HTMLAnchorElement>
	open?: boolean
}> = (props) => {
	return (
		<a
			className={classNames('connection-status', {
				ok: props.ok,
				clickable: Boolean(props.onClick),
				open: props.open,
			})}
			title={props.tooltip}
			href={props.onClick ? '#' : undefined}
			onClick={props.onClick}
		>
			<div className="connection-status__content">
				<div className="connection-status__label">{props.label}</div>

				<div className="connection-status__dot"></div>
			</div>
		</a>
	)
}
