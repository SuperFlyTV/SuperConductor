import { Typography, Button, Box } from '@mui/material'
import { literal } from '@shared/lib'
import React, { useCallback, useContext, useState } from 'react'
import {
	DeviceOptionsAny,
	DeviceOptionsAtem,
	DeviceOptionsCasparCG,
	DeviceOptionsOBS,
	DeviceOptionsOSC,
	DeviceOptionsVMix,
	DeviceType,
	OSCDeviceType,
} from 'timeline-state-resolver-types'
import { Bridge, BridgeStatus } from '../../../../models/project/Bridge'
import { Project } from '../../../../models/project/Project'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ProjectContext } from '../../../contexts/Project'
import { Device } from './Device'
import { NewDeviceDialog } from './NewDeviceDialog'

interface IDeviceListProps {
	bridge: Bridge
	devices: BridgeStatus['devices']
}

export const DeviceList: React.FC<IDeviceListProps> = ({ bridge, devices }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [editing, setEditing] = useState(false)
	const [addDeviceOpen, setAddDeviceOpen] = useState(false)

	const onNewDeviceAccepted = useCallback(
		({ deviceType }: { deviceType: number }) => {
			let newDevice: DeviceOptionsAny
			let newDeviceId = 'new-device'

			switch (deviceType) {
				case DeviceType.CASPARCG: {
					newDevice = literal<DeviceOptionsCasparCG>({
						type: DeviceType.CASPARCG,
						options: {
							host: '127.0.0.1',
							port: 5250,
						},
					})

					const numCasparCGDevices = Object.values(bridge.settings.devices).filter(
						(device) => device.type === DeviceType.CASPARCG
					).length
					newDeviceId = `casparcg${numCasparCGDevices}`

					break
				}

				case DeviceType.ATEM: {
					newDevice = literal<DeviceOptionsAtem>({
						type: DeviceType.ATEM,
						options: {
							host: '192.168.0.5',
							port: 9910,
						},
					})

					const numATEMDevices = Object.values(bridge.settings.devices).filter(
						(device) => device.type === DeviceType.ATEM
					).length
					newDeviceId = `atem${numATEMDevices}`

					break
				}

				case DeviceType.OBS: {
					newDevice = literal<DeviceOptionsOBS>({
						type: DeviceType.OBS,
						options: {
							host: '127.0.0.1',
							port: 4444,
						},
					})

					const numOBSDevices = Object.values(bridge.settings.devices).filter(
						(device) => device.type === DeviceType.OBS
					).length
					newDeviceId = `obs${numOBSDevices}`

					break
				}

				case DeviceType.VMIX: {
					newDevice = literal<DeviceOptionsVMix>({
						type: DeviceType.VMIX,
						options: {
							host: '127.0.0.1',
							port: 8088,
						},
					})

					const numVMixDevices = Object.values(bridge.settings.devices).filter(
						(device) => device.type === DeviceType.VMIX
					).length
					newDeviceId = `vmix${numVMixDevices}`

					break
				}

				case DeviceType.OSC: {
					newDevice = literal<DeviceOptionsOSC>({
						type: DeviceType.OSC,
						options: {
							host: '127.0.0.1',
							port: 9000,
							type: OSCDeviceType.UDP,
						},
					})

					const numOSCDevices = Object.values(bridge.settings.devices).filter(
						(device) => device.type === DeviceType.OSC
					).length
					newDeviceId = `osc${numOSCDevices}`

					break
				}

				// @TODO: Add more device types

				default:
					// Do nothing.
					// assertNever(deviceType)
					return
			}

			const editedDevices = {
				...bridge.settings.devices,
				[newDeviceId]: newDevice,
			}
			const editedBridge: Bridge = {
				...bridge,
				settings: {
					...bridge.settings,
					devices: editedDevices,
				},
			}
			const editedProject: Project = {
				...project,
				bridges: {
					...project.bridges,
					[editedBridge.id]: editedBridge,
				},
			}

			ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)

			setAddDeviceOpen(false)
		},
		[bridge, handleError, ipcServer, project]
	)

	return (
		<div className="device-list">
			<Typography variant="subtitle1">Device settings</Typography>
			{Object.entries(devices).map(([id, device]) => {
				return <Device key={id} bridge={bridge} deviceId={id} device={device} editing={editing} />
			})}

			{editing && (
				<Box marginBottom="1.5rem">
					<Button
						variant="contained"
						onClick={() => {
							setAddDeviceOpen(true)
						}}
					>
						Add Device
					</Button>
				</Box>
			)}

			<Button
				variant="contained"
				sx={{ width: '165px' }}
				onClick={() => {
					setEditing((editing) => !editing)
				}}
			>
				{editing ? 'Finish editing' : 'Edit devices'}
			</Button>

			<NewDeviceDialog
				open={addDeviceOpen}
				onAccepted={onNewDeviceAccepted}
				onDiscarded={() => {
					setAddDeviceOpen(false)
				}}
			/>
		</div>
	)
}
