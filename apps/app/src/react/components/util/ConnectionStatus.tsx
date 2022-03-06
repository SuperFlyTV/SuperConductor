import React from 'react'
import classNames from 'classnames'

interface IConnectionStatusProps {
	ok?: boolean
	tooltip?: string
	label?: string
	children?: React.ReactNode
}

export function ConnectionStatus({ ok, tooltip, label }: IConnectionStatusProps) {
	return (
		<div
			className={classNames('connection-status', {
				ok,
			})}
			title={tooltip}
		>
			{label}

			<div className="connection-status__dot"></div>
		</div>
	)
}
