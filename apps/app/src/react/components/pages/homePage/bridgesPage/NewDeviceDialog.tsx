import React, { useCallback, useContext, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import {
	DeviceOptionsAny,
	DeviceOptionsAtem,
	DeviceOptionsCasparCG,
	DeviceOptionsHTTPSend,
	DeviceOptionsHyperdeck,
	DeviceOptionsOBS,
	DeviceOptionsOSC,
	DeviceOptionsTCPSend,
	DeviceOptionsTriCaster,
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
import { shortID } from '../../../../../lib/util'
import { getDefaultDeviceName } from '../../../../../lib/TSRMappings'
import { TSRDeviceId, protectString, unprotectString } from '@shared/models'
import { BridgeId } from '@shared/api'

interface INewDeviceDialogProps {
	open: boolean
	onAccepted: (deviceId: TSRDeviceId) => void
	onDiscarded: () => void
	bridge: Bridge
}

export function NewDeviceDialog({ open, onAccepted, onDiscarded, bridge }: INewDeviceDialogProps): JSX.Element {
	const [deviceType, setDeviceType] = useState(DeviceType.CASPARCG)
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const onNewDeviceAccepted = useCallback(
		(newDeviceType: number) => {
			let newDevice: DeviceOptionsAny

			switch (newDeviceType) {
				case DeviceType.CASPARCG:
					newDevice = literal<DeviceOptionsCasparCG>({
						type: DeviceType.CASPARCG,
						options: {
							host: '127.0.0.1',
							port: 5250,
						},
					})
					break

				case DeviceType.ATEM:
					newDevice = literal<DeviceOptionsAtem>({
						type: DeviceType.ATEM,
						options: {
							host: '192.168.0.5',
							port: 9910,
						},
					})
					break

				case DeviceType.OBS:
					newDevice = literal<DeviceOptionsOBS>({
						type: DeviceType.OBS,
						options: {
							host: '127.0.0.1',
							port: 4444,
						},
					})
					break

				case DeviceType.VMIX:
					newDevice = literal<DeviceOptionsVMix>({
						type: DeviceType.VMIX,
						options: {
							host: '127.0.0.1',
							port: 8099,
						},
					})
					break

				case DeviceType.OSC:
					newDevice = literal<DeviceOptionsOSC>({
						type: DeviceType.OSC,
						options: {
							host: '127.0.0.1',
							port: 9000,
							type: OSCDeviceType.UDP,
						},
					})
					break

				case DeviceType.HTTPSEND:
					newDevice = literal<DeviceOptionsHTTPSend>({
						type: DeviceType.HTTPSEND,
						options: {},
					})
					break

				case DeviceType.HYPERDECK:
					newDevice = literal<DeviceOptionsHyperdeck>({
						type: DeviceType.HYPERDECK,
						options: {
							host: '192.168.0.10',
							port: 9993,
						},
					})
					break

				case DeviceType.TCPSEND:
					newDevice = literal<DeviceOptionsTCPSend>({
						type: DeviceType.TCPSEND,
						options: {
							host: '192.168.0.10',
							port: 23,
						},
					})
					break

				case DeviceType.TRICASTER:
					newDevice = literal<DeviceOptionsTriCaster>({
						type: DeviceType.TRICASTER,
						options: {
							host: '192.168.0.10',
							port: 80,
						},
					})
					break

				// @TODO: Add more device types

				default:
					// Do nothing.
					// assertNever(deviceType)
					return
			}

			const newDeviceIdStr = shortID()
			const newDeviceId = protectString<TSRDeviceId>(newDeviceIdStr)

			const editedDevices = {
				...bridge.settings.devices,
				[newDeviceIdStr]: newDevice,
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
					[unprotectString<BridgeId>(editedBridge.id)]: editedBridge,
				},
				deviceNames: {
					...project.deviceNames,
					[newDeviceIdStr]: getDefaultDeviceName(newDeviceType),
				},
			}

			ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)

			onAccepted(newDeviceId)
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
					<MenuItem value={DeviceType.HTTPSEND}>HTTP Send</MenuItem>
					<MenuItem value={DeviceType.HYPERDECK}>HyperDeck</MenuItem>
					<MenuItem value={DeviceType.TCPSEND}>TCP Send</MenuItem>
					<MenuItem value={DeviceType.TRICASTER}>TriCaster</MenuItem>
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
