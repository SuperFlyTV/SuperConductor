import React, { useCallback } from 'react'
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { ConnectionStatus } from './ConnectionStatus'
import { Popover } from '@mui/material'
import { PeripheralSettings } from './PeripheralSettings/PeripheralSettings'

export const DeviceStatuses: React.FC = observer(function DeviceStatuses() {
	const appStore = store.appStore

	const [submenuPopover, setSubmenuPopover] = React.useState<{
		anchorEl: HTMLAnchorElement
		peripheralId: string
	} | null>(null)
	const closeSubMenu = useCallback(() => {
		setSubmenuPopover(null)
	}, [])

	return (
		<>
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
							label={peripheral.info.name}
							tooltip={peripheral.status.connected ? 'Disconnected' : ''}
							ok={bridgeIsConnected && peripheral.status.connected}
							open={submenuPopover?.peripheralId === peripheralId}
							onClick={(event) => {
								event.preventDefault()

								setSubmenuPopover({
									anchorEl: event.currentTarget,
									peripheralId,
								})
							}}
						/>
					)
				})}
			</div>

			<Popover
				open={Boolean(submenuPopover)}
				anchorEl={submenuPopover?.anchorEl}
				onClose={closeSubMenu}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'center',
				}}
			>
				{submenuPopover ? (
					<PeripheralSettings
						peripheralId={submenuPopover.peripheralId}
						peripheral={appStore.peripherals[submenuPopover.peripheralId]}
					/>
				) : null}
			</Popover>
		</>
	)
})
