import { observer } from 'mobx-react-lite'
import React from 'react'
import { Project } from '../../../../../models/project/Project'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { ScList } from '../scList/ScList'
import { DeviceItemContent } from './DeviceItemContent'
import { DeviceItemHeader } from './DeviceItemHeader'
import { getDeviceName } from '../../../../../lib/util'

export const DevicesList: React.FC<{
	bridge: Bridge
	devices: BridgeStatus['devices']
	project: Project
	newlyCreatedDeviceId: string | undefined
}> = observer(function DevicesList(props) {
	return (
		<div className="devices-list">
			<ScList
				openByDefault={props.newlyCreatedDeviceId ? [props.newlyCreatedDeviceId] : []}
				list={Object.entries(props.devices)
					/**
					 * Temporary fix - required because props.devices and props.bridge.settings.device
					 * do not have the same devices (props.devices does not get updated).
					 * TODO - fix this bug on the backend side.
					 */
					.filter(([id]) => {
						return props.bridge.settings.devices[id]
					})
					.map(([deviceId, device]) => {
						const deviceName = getDeviceName(props.project, deviceId)

						return {
							id: deviceId,
							header: (
								<DeviceItemHeader
									key={deviceId}
									bridge={props.bridge}
									deviceId={deviceId}
									device={device}
									deviceName={deviceName}
								/>
							),
							content: (
								<DeviceItemContent
									key={deviceId}
									bridge={props.bridge}
									deviceId={deviceId}
									device={device}
									deviceName={deviceName || ''}
								/>
							),
						}
					})}
			/>
			{}
		</div>
	)
})
