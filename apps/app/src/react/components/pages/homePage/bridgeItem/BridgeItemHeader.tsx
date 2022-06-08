import React from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { DeviceShortcut } from '../deviceShorcut/DeviceShortcut'
import { ScListItemLabel } from '../scList/ScListItemLabel'
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
	bridgeStatus: BridgeStatus | undefined
}> = (props) => {
	const bridgeStatus: BridgeStatus = props.bridgeStatus || {
		connected: false,
		devices: {},
	}
	return (
		<div className="bridge-item-header">
			<StatusCircle status={bridgeStatus.connected ? 'connected' : 'disconnected'} />
			<ScListItemLabel title={props.bridge.name} subtitle={props.bridge.url} />

			{Object.entries(bridgeStatus?.devices).filter(([id]) => {
				return props.bridge.settings.devices[id]
			}).length > 0 && (
				<div className="device-statuses">
					<div className="label">Device statuses:</div>
					{Object.entries(bridgeStatus?.devices)
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
