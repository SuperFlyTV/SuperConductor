import React, { useContext, useMemo } from 'react'
import { Bridge as BridgeType, BridgeStatus } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { Button, Divider, Typography } from '@mui/material'
import { Bridge } from './Bridge'
import { literal } from '@shared/lib'
import { DeviceOptionsCasparCG, DeviceType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { IPCServerContext } from '../../contexts/IPCServer'

interface IBridgesSettingsProps {
	project: Project
	bridgeStatuses: { [bridgeId: string]: BridgeStatus }
}

export const BridgesSettings: React.FC<IBridgesSettingsProps> = ({ project, bridgeStatuses }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const incomingBridges = useMemo(() => {
		return Object.values(project.bridges).filter((bridge) => {
			return !bridge.outgoing
		})
	}, [project.bridges])

	const outgoingBridges = useMemo(() => {
		return Object.values(project.bridges).filter((bridge) => {
			return bridge.outgoing
		})
	}, [project.bridges])

	return (
		<>
			<Typography variant="h6" marginTop="3rem">
				Bridges
			</Typography>
			<Divider />

			<Typography variant="subtitle1">Incoming bridges</Typography>
			<Typography variant="subtitle2" sx={{ fontStyle: 'italic' }}>
				This is a list of Bridges that have connected to SuperConductor
			</Typography>
			{incomingBridges.map((bridge) => (
				<Bridge key={bridge.id} bridge={bridge} bridgeStatus={bridgeStatuses[bridge.id]} />
			))}
			{incomingBridges.length === 0 && <Typography variant="body1">There are no incoming bridges.</Typography>}

			<Typography variant="subtitle1" marginTop="2rem">
				Outgoing bridges
			</Typography>
			<Typography variant="subtitle2" sx={{ fontStyle: 'italic' }}>
				This is a list of Bridges that SuperConductor will connect to
			</Typography>
			{outgoingBridges.map((bridge) => (
				<Bridge key={bridge.id} bridge={bridge} bridgeStatus={bridgeStatuses[bridge.id]} />
			))}
			{outgoingBridges.length === 0 && (
				<Typography variant="body1" marginBottom="1.8rem">
					There are no outgoing bridges.
				</Typography>
			)}

			<Button
				variant="contained"
				onClick={() => {
					const numBridges = Object.keys(project.bridges).length
					const newBridge = literal<BridgeType>({
						id: `bridge${numBridges}`,
						name: `Bridge${numBridges}`,
						outgoing: true,
						url: 'ws://localhost:5401',
						settings: {
							devices: {
								casparcg0: literal<DeviceOptionsCasparCG>({
									type: DeviceType.CASPARCG,
									options: { host: '127.0.0.1', port: 5250 },
								}),
							},
						},
					})

					const editedBridges = {
						...project.bridges,
						[newBridge.id]: newBridge,
					}

					const editedProject: Project = {
						...project,
						bridges: editedBridges,
					}

					ipcServer.updateProject({ id: editedProject.id, project: editedProject }).catch(handleError)
				}}
			>
				Add Bridge connection
			</Button>
		</>
	)
}
