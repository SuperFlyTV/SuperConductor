import classNames from 'classnames'
import React from 'react'

export const StatusCircle: React.FC<{ status: 'connected' | 'disconnected' }> = (props) => {
	return <div className={classNames('status-circle', { connected: props.status === 'connected' })} />
}
