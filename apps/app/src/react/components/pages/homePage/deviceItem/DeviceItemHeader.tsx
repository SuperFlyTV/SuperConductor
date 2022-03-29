import React from 'react'
import { Bridge, BridgeDevice } from '../../../../../models/project/Bridge'
import { AtemOptions, CasparCGOptions } from 'timeline-state-resolver-types'

import './style.scss'
import { DeviceShortcut } from '../deviceShorcut/DeviceShortcut'

export const DeviceItemHeader: React.FC<{
	bridge: Bridge
	deviceId: string
	device: BridgeDevice
}> = (props) => {
	const deviceSettings = props.bridge.settings.devices[props.deviceId]

	if (!deviceSettings || !deviceSettings.options) return <></>

	const deviceOptions = deviceSettings.options as CasparCGOptions | AtemOptions

	if (!deviceOptions) {
		return null
	}
	const deviceAddress = `${deviceOptions.host}:${deviceOptions.port}`

	return (
		<div className="device-item-header">
			<DeviceShortcut device={props.device} type={deviceSettings.type} />
			<div className="header-label">
				<div className="title">{props.deviceId}</div>
				<div className="subtitle">{deviceAddress}</div>
			</div>
			<div className="status">
				{props.device.ok ? 'Connected' : props.device.message ? props.device.message : 'Not Connected'}
			</div>
		</div>
	)
}
