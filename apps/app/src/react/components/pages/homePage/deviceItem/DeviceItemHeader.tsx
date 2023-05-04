import React from 'react'
import { Bridge, BridgeDevice } from '../../../../../models/project/Bridge'
import { AtemOptions, CasparCGOptions, DeviceType } from 'timeline-state-resolver-types'

import './style.scss'
import { DeviceShortcut } from '../deviceShorcut/DeviceShortcut'
import { ScListItemLabel } from '../scList/ScListItemLabel'

export const DeviceItemHeader: React.FC<{
	bridge: Bridge
	deviceId: string
	device: BridgeDevice
	deviceName?: string
}> = (props) => {
	const deviceSettings = props.bridge.settings.devices[props.deviceId]

	if (!deviceSettings || !deviceSettings.options) return <></>

	const deviceOptions = deviceSettings.options as CasparCGOptions | AtemOptions

	if (!deviceOptions) {
		return null
	}
	let deviceAddress = `${deviceOptions.host}:${deviceOptions.port}`
	if (deviceSettings.type === DeviceType.HTTPSEND) {
		deviceAddress = ''
	}

	return (
		<div className="device-item-header openable">
			<DeviceShortcut device={props.device} type={deviceSettings.type} />
			<ScListItemLabel title={props.deviceName || props.deviceId} subtitle={deviceAddress} />
			<div className="status">
				{deviceSettings.disable
					? 'Disabled'
					: props.device.ok
					? 'Connected'
					: props.device.message
					? props.device.message
					: 'Not Connected'}
			</div>
		</div>
	)
}
