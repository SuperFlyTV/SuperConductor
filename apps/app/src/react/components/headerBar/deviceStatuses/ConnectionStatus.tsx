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
			{props.label}

			<div className="connection-status__dot"></div>
		</a>
	)
}
