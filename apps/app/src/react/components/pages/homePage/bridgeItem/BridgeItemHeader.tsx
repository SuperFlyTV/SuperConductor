import React from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { DeviceShortcut } from '../deviceShorcut/DeviceShortcut'
import { StatusCircle } from '../scList/StatusCircle'

import './style.scss'

export const BridgeItemHeader: React.FC<{
	id: string
	/**
	 * Information about the bridge and devices
	 */
	bridge: Bridge
	/**
	 * Status of the bridge and all devices
	 */
	bridgeStatus: BridgeStatus
}> = (props) => {
	return (
		<div className="bridge-item-header">
			<StatusCircle status={props.bridgeStatus.connected ? 'connected' : 'disconnected'} />
			<div className="header-label">
				<div className="title">{props.bridge.name}</div>
				<div className="subtitle">{props.bridge.url}</div>
			</div>
			<div className="device-statuses">
				<div className="label">Device statuses:</div>
				{Object.entries(props.bridgeStatus?.devices)
					/**
					 * Temporary fix - just like in DevicesList.tsx.
					 * TODO - fix this bug on the backend side.
					 */
					.filter(([id]) => {
						return props.bridge.settings.devices[id]
					})
					.map(([deviceId, device]) => {
						const deviceSettings = props.bridge.settings.devices[deviceId]

						return <DeviceShortcut key={deviceId} device={device} type={deviceSettings?.type} />
					})}
			</div>
		</div>
	)
}
