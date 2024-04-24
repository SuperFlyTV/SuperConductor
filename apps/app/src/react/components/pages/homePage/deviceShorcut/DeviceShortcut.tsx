import React from 'react'
import { BridgeDevice } from '@/models/project/Bridge'
import { DeviceType } from 'timeline-state-resolver-types'
import { DeviceIcon } from '../deviceIcon/DeviceIcon'
import { StatusCircle } from '../scList/StatusCircle'

import './style.scss'

export const DeviceShortcut: React.FC<{ device: BridgeDevice; type: DeviceType }> = (props) => {
	const statusMessage = props.device.ok ? 'Connected' : props.device.message ? props.device.message : 'Not Connected'

	return (
		<div className="device-shortcut" title={statusMessage}>
			<StatusCircle status={props.device.ok ? 'connected' : 'disconnected'} />
			<DeviceIcon type={props.type} />
		</div>
	)
}
