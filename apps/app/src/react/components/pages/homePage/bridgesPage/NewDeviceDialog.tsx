import React, { useCallback, useContext, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
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
import { Bridge } from '../../../../../models/project/Bridge'
import { literal } from '@shared/lib'
import { Project } from '../../../../../models/project/Project'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'

interface INewDeviceDialogProps {
	open: boolean
	onAccepted: ({ deviceType }: { deviceType: number }) => void
	onDiscarded: () => void
	bridge: Bridge
}

export function NewDeviceDialog({ open, onAccepted, onDiscarded, bridge }: INewDeviceDialogProps) {
	const [deviceType, setDeviceType] = useState(DeviceType.CASPARCG)
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const onNewDeviceAccepted = useCallback(
		(newDeviceType: number) => {
			let newDevice: DeviceOptionsAny
			let newDeviceId: string

			switch (newDeviceType) {
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

			onAccepted({ deviceType: newDeviceType })
		},
		[bridge, handleError, ipcServer, project, onAccepted]
	)

	const accept = useCallback(() => {
		onNewDeviceAccepted(deviceType)
	}, [deviceType, onNewDeviceAccepted])

	return (
		<Dialog
			open={open}
			onClose={onDiscarded}
			onKeyUp={(e) => {
				if (e.key === 'Enter') accept()
			}}
		>
			<DialogTitle>Add New Device</DialogTitle>
			<DialogContent>
				<TextField
					select
					margin="normal"
					fullWidth
					autoFocus
					label="Device Type"
					value={deviceType.toString()}
					onChange={(event) => {
						setDeviceType(parseInt(event.target.value, 10))
					}}
				>
					<MenuItem value={DeviceType.CASPARCG}>CasparCG</MenuItem>
					<MenuItem value={DeviceType.ATEM}>ATEM</MenuItem>
					<MenuItem value={DeviceType.OBS}>OBS</MenuItem>
					<MenuItem value={DeviceType.VMIX}>vMix</MenuItem>
					<MenuItem value={DeviceType.OSC}>OSC</MenuItem>
					{/* @TODO: More device types */}
				</TextField>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" onClick={onDiscarded}>
					Cancel
				</Button>
				<Button variant="contained" onClick={accept}>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	)
}
