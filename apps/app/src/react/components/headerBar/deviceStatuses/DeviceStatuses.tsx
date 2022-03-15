import React from 'react'
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { ConnectionStatus } from './ConnectionStatus'

export const DeviceStatuses: React.FC = observer(() => {
	const appStore = store.appStore

	return (
		<div className="device-statuses">
			{Object.entries(appStore.bridgeStatuses).map(([bridgeId, bridgeStatus]) => {
				return Object.entries(bridgeStatus.devices).map(([deviceId, deviceStatus]) => {
					return (
						<ConnectionStatus
							key={`${bridgeId}_${deviceId}`}
							label={deviceId}
							tooltip={bridgeStatus.connected ? deviceStatus.message : 'Bridge is disconnected'}
							ok={bridgeStatus.connected && deviceStatus.ok}
						/>
					)
				})
			})}
			{Object.entries(appStore.peripherals).map(([peripheralId, peripheral]) => {
				const bridge = appStore.bridgeStatuses[peripheral.bridgeId]

				const bridgeIsConnected = bridge && bridge.connected

				return (
					<ConnectionStatus
						key={`${peripheralId}`}
						label={peripheral.name}
						tooltip={peripheral.status.connected ? 'Disconnected' : ''}
						ok={bridgeIsConnected && peripheral.status.connected}
					/>
				)
			})}
		</div>
	)
})
