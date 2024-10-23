import React, { useCallback, useContext } from 'react'
import { store } from '../../../mobx/store.js'
import { observer } from 'mobx-react-lite'
import { ConnectionStatus } from './ConnectionStatus.js'
import { Button, Popover } from '@mui/material'
import { PeripheralSettings } from './PeripheralSettings/PeripheralSettings.js'
import { getDeviceName, sortOn } from '../../../../lib/util.js'
import { useMemoComputedObject } from '../../../mobx/lib.js'
import { Bridge, BridgeDevice, BridgeStatus } from '../../../../models/project/Bridge.js'
import { DeviceOptionsAny } from 'timeline-state-resolver-types'
import { ProjectContext } from '../../../contexts/Project.js'
import { BridgeId, KnownPeripheral, PeripheralId, PeripheralSettingsBase } from '@shared/api'
import { MdAdd } from 'react-icons/md'
import {
	DisabledPeripheralInfo,
	DisabledPeripheralsSettings,
} from './DisabledPeripherals/DisabledPeripheralsSettings.js'
import { TSRDeviceId, protectString, unprotectString } from '@shared/models'
import { getPeripheralId } from '@shared/lib'

export const DeviceStatuses: React.FC = observer(function DeviceStatuses() {
	const project = useContext(ProjectContext)
	const appStore = store.appStore
	const gui = store.guiStore

	const [submenuPopover, setSubmenuPopover] = React.useState<{
		anchorEl: HTMLAnchorElement
		bridgeId: BridgeId
		deviceId: PeripheralId
	} | null>(null)
	const closeSubMenu = useCallback(() => {
		setSubmenuPopover(null)
		gui.isPeripheralPopoverOpen = true
	}, [gui])

	const [disabledPeripheralsPopover, setDisabledPeripheralsPopover] = React.useState<{
		anchorEl: HTMLButtonElement
	} | null>(null)
	const closeDisabledPeripheralsPopover = useCallback(() => {
		setDisabledPeripheralsPopover(null)
	}, [])

	const allDevices = useMemoComputedObject(() => {
		const newAllDevices: {
			bridgeId: BridgeId
			bridgeStatus: BridgeStatus
			deviceId: TSRDeviceId
			deviceStatus: BridgeDevice
			deviceSettings: DeviceOptionsAny | undefined
		}[] = []
		for (const [bridgeId, bridgeStatus] of appStore.bridgeStatuses.entries()) {
			const bridgeSettings = project.bridges[unprotectString<BridgeId>(bridgeId)] as Bridge | undefined
			if (!bridgeSettings) continue
			for (const [deviceId, deviceStatus] of Object.entries<BridgeDevice>(bridgeStatus.devices)) {
				newAllDevices.push({
					bridgeId,
					bridgeStatus,
					deviceId: protectString(deviceId),
					deviceStatus,
					deviceSettings: bridgeSettings.settings.devices[deviceId],
				})
			}
		}

		return newAllDevices.sort(sortOn((o) => [o.deviceSettings?.type, o.bridgeId, o.deviceId]))
	}, [appStore.bridgeStatuses, project])
	const allPeripherals = useMemoComputedObject(() => {
		return Array.from(appStore.peripherals.entries()).sort(sortOn((x) => x[0]))
	}, [appStore.peripherals])
	const disabledPeripherals = useMemoComputedObject(() => {
		const newDisabledPeripherals: DisabledPeripheralInfo[] = []
		for (const [bridgeId, bridgeStatus] of appStore.bridgeStatuses.entries()) {
			const bridgeSettings = project.bridges[unprotectString<BridgeId>(bridgeId)] as Bridge | undefined

			if (!bridgeSettings) continue
			if (bridgeSettings.settings.autoConnectToAllPeripherals) continue
			for (const [peripheralId0, peripheralSettings] of Object.entries<PeripheralSettingsBase>(
				bridgeSettings.settings.peripherals
			)) {
				const peripheralId = protectString<PeripheralId>(peripheralId0)

				if (peripheralSettings.manualConnect) {
					// This peripheral is already one that the user has indicated they would like to connect to.
					continue
				}
				const peripheralInfo = bridgeStatus.peripherals[unprotectString<PeripheralId>(peripheralId)] as
					| KnownPeripheral
					| undefined
				if (!peripheralInfo) continue
				newDisabledPeripherals.push({
					bridgeId,
					deviceId: peripheralId,
					info: peripheralInfo,
				})
			}
		}

		return newDisabledPeripherals
	}, [project])

	return (
		<>
			<div className="device-statuses">
				{disabledPeripherals.length ? (
					<Button
						onClick={(event) => {
							event.preventDefault()

							setDisabledPeripheralsPopover({
								anchorEl: event.currentTarget,
							})
						}}
					>
						<MdAdd size={24} />
					</Button>
				) : null}
				{allDevices.map(({ bridgeId, bridgeStatus, deviceId, deviceStatus }) => {
					const deviceName = getDeviceName(project, deviceId)

					return (
						<ConnectionStatus
							key={`${bridgeId}_${deviceId}`}
							label={deviceName || 'Untitled device'}
							tooltip={bridgeStatus.connected ? deviceStatus.message : 'Bridge is disconnected'}
							ok={bridgeStatus.connected && deviceStatus.ok}
						/>
					)
				})}
				{allPeripherals.map(([peripheralId, peripheral]) => {
					const bridge = appStore.bridgeStatuses.get(peripheral.bridgeId)

					const bridgeIsConnected = bridge && bridge.connected

					return (
						<ConnectionStatus
							key={`${peripheralId}`}
							label={peripheral.info.name}
							tooltip={peripheral.status.connected ? '' : 'Disconnected'}
							ok={bridgeIsConnected && peripheral.status.connected}
							open={
								submenuPopover?.bridgeId === peripheral.bridgeId &&
								submenuPopover?.deviceId === peripheral.id
							}
							onClick={(event) => {
								event.preventDefault()

								setSubmenuPopover({
									anchorEl: event.currentTarget,
									bridgeId: peripheral.bridgeId,
									deviceId: peripheral.id,
								})
								gui.isPeripheralPopoverOpen = true
							}}
						/>
					)
				})}
			</div>

			<Popover
				open={Boolean(disabledPeripheralsPopover)}
				anchorEl={disabledPeripheralsPopover?.anchorEl}
				onClose={closeDisabledPeripheralsPopover}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				{disabledPeripheralsPopover ? (
					<DisabledPeripheralsSettings
						peripherals={disabledPeripherals}
						onPeripheralClicked={closeDisabledPeripheralsPopover}
					/>
				) : null}
			</Popover>

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
						deviceId={submenuPopover.deviceId}
						peripheral={appStore.peripherals.get(
							getPeripheralId(submenuPopover.bridgeId, submenuPopover.deviceId)
						)}
						onDisconnect={closeSubMenu}
					/>
				) : null}
			</Popover>
		</>
	)
})
