import React from 'react'
import classNames from 'classnames'

export const ConnectionStatus: React.FC<{
	ok?: boolean
	tooltip?: string
	label?: string
	children?: React.ReactNode
}> = (props) => {
	return (
		<div
			className={classNames('connection-status', {
				ok: props.ok,
			})}
			title={props.tooltip}
		>
			{props.label}

			<div className="connection-status__dot"></div>
		</div>
	)
}
