import React from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { ScList } from '../scList/ScList'
import { DeviceItemContent } from './DeviceItemContent'
import { DeviceItemHeader } from './DeviceItemHeader'

export const DevicesList: React.FC<{ bridge: Bridge; devices: BridgeStatus['devices'] }> = (props) => {
	return (
		<div className="devices-list">
			<ScList
				list={Object.entries(props.devices)
					/**
					 * Temporary fix - required because props.devices and props.bridge.settings.device
					 * do not have the same devices (props.devices does not get updated).
					 * TODO - fix this bug on the backend side.
					 */
					.filter(([id]) => {
						return props.bridge.settings.devices[id]
					})
					.map(([id, device]) => {
						return {
							id: id,
							header: <DeviceItemHeader key={id} bridge={props.bridge} deviceId={id} device={device} />,
							content: <DeviceItemContent key={id} bridge={props.bridge} deviceId={id} device={device} />,
						}
					})}
			/>
			{}
		</div>
	)
}
