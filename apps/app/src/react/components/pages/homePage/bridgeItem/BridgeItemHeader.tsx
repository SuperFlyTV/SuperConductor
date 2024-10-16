import React from 'react'
import { Bridge, BridgeDevice, BridgeStatus } from '../../../../../models/project/Bridge.js'
import { DeviceShortcut } from '../deviceShorcut/DeviceShortcut.js'
import { ScListItemLabel } from '../scList/ScListItemLabel.js'
import { StatusCircle } from '../scList/StatusCircle.js'

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
	bridgeStatus: BridgeStatus | undefined
}> = (props) => {
	const bridgeStatus: BridgeStatus = props.bridgeStatus || {
		connected: false,
		devices: {},
		peripherals: {},
	}
	return (
		<div className="bridge-item-header">
			<StatusCircle status={bridgeStatus.connected ? 'connected' : 'disconnected'} />
			<ScListItemLabel title={props.bridge.name} subtitle={props.bridge.url} />

			{Object.entries<BridgeDevice>(bridgeStatus?.devices).filter(([id]) => {
				return props.bridge.settings.devices[id]
			}).length > 0 && (
				<div className="device-statuses">
					<div className="label">Device statuses:</div>
					{Object.entries<BridgeDevice>(bridgeStatus?.devices)
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
			)}
		</div>
	)
}
