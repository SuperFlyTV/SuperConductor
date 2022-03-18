import React, { useCallback, useContext, useMemo } from 'react'
import { Bridge as BridgeType, INTERNAL_BRIDGE_ID } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { Button, Typography, FormControlLabel, Switch } from '@mui/material'
import { Bridge } from './Bridge'
import { literal } from '@shared/lib'
import { DeviceOptionsCasparCG, DeviceType } from 'timeline-state-resolver-types'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { IPCServerContext } from '../../contexts/IPCServer'
import { store } from '../../mobx/store'
import { observer } from 'mobx-react-lite'

interface IBridgesSettingsProps {
	project: Project
}

export const BridgesSettings: React.FC<IBridgesSettingsProps> = observer(({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const bridgeStatuses = store.appStore.bridgeStatuses

	const internalBridge = useMemo(() => {
		return project.bridges[INTERNAL_BRIDGE_ID]
	}, [project.bridges])

	const incomingBridges = useMemo(() => {
		return Object.values(project.bridges).filter((bridge) => {
			return !bridge.outgoing && bridge.id !== INTERNAL_BRIDGE_ID
		})
	}, [project.bridges])

	const outgoingBridges = useMemo(() => {
		return Object.values(project.bridges).filter((bridge) => {
			return bridge.outgoing && bridge.id !== INTERNAL_BRIDGE_ID
		})
	}, [project.bridges])

	const addBridge = useCallback(() => {
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

		project.bridges[newBridge.id] = newBridge
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	const toggleInternalBridge = useCallback(() => {
		project.settings.enableInternalBridge = !project.settings.enableInternalBridge
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	return (
		<>
			<FormControlLabel
				control={<Switch checked={project.settings.enableInternalBridge} onChange={toggleInternalBridge} />}
				label="Enable internal bridge"
				labelPlacement="start"
			/>

			{internalBridge && project.settings.enableInternalBridge && (
				<Bridge bridge={internalBridge} bridgeStatus={bridgeStatuses[INTERNAL_BRIDGE_ID]} internal />
			)}

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

			<Button variant="contained" onClick={addBridge}>
				Add Bridge connection
			</Button>
		</>
	)
})
