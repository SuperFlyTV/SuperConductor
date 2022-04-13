import React, { useCallback, useContext } from 'react'
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { ConnectionStatus } from './ConnectionStatus'
import { Popover } from '@mui/material'
import { PeripheralSettings } from './PeripheralSettings/PeripheralSettings'
import { sortOn } from '../../../../lib/util'
import { useMemoComputedObject } from '../../../mobx/lib'
import { Bridge, BridgeDevice, BridgeStatus } from '../../../../models/project/Bridge'
import { DeviceOptionsAny } from 'timeline-state-resolver-types'
import { ProjectContext } from '../../../contexts/Project'

export const DeviceStatuses: React.FC = observer(function DeviceStatuses() {
	const project = useContext(ProjectContext)
	const appStore = store.appStore

	const [submenuPopover, setSubmenuPopover] = React.useState<{
		anchorEl: HTMLAnchorElement
		bridgeId: string
		peripheralId: string
	} | null>(null)
	const closeSubMenu = useCallback(() => {
		setSubmenuPopover(null)
	}, [])

	const allDevices = useMemoComputedObject(() => {
		const newAllDevices: {
			bridgeId: string
			bridgeStatus: BridgeStatus
			deviceId: string
			deviceStatus: BridgeDevice
			deviceSettings: DeviceOptionsAny | undefined
		}[] = []
		for (const [bridgeId, bridgeStatus] of Object.entries(appStore.bridgeStatuses)) {
			const bridgeSettings = project.bridges[bridgeId] as Bridge | undefined
			if (!bridgeSettings) continue
			for (const [deviceId, deviceStatus] of Object.entries(bridgeStatus.devices)) {
				newAllDevices.push({
					bridgeId,
					bridgeStatus,
					deviceId,
					deviceStatus,
					deviceSettings: bridgeSettings.settings.devices[deviceId],
				})
			}
		}

		return newAllDevices.sort(sortOn((o) => [o.deviceSettings?.type, o.bridgeId, o.deviceId]))
	}, [appStore.bridgeStatuses, project])
	const allPeripherals = useMemoComputedObject(() => {
		return Object.entries(appStore.peripherals).sort(sortOn((x) => x[0]))
	}, [appStore.peripherals])

	return (
		<>
			<div className="device-statuses">
				{allDevices.map(({ bridgeId, bridgeStatus, deviceId, deviceStatus }) => {
					return (
						<ConnectionStatus
							key={`${bridgeId}_${deviceId}`}
							label={deviceId}
							tooltip={bridgeStatus.connected ? deviceStatus.message : 'Bridge is disconnected'}
							ok={bridgeStatus.connected && deviceStatus.ok}
						/>
					)
				})}
				{allPeripherals.map(([peripheralId, peripheral]) => {
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
									bridgeId: peripheral.bridgeId,
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
						bridgeId={submenuPopover.bridgeId}
						peripheralId={submenuPopover.peripheralId}
						peripheral={appStore.peripherals[submenuPopover.peripheralId]}
					/>
				) : null}
			</Popover>
		</>
	)
})
