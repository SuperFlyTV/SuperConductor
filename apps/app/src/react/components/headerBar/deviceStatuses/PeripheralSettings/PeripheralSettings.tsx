import React, { useCallback, useContext } from 'react'
import { Box, Button, Grid } from '@mui/material'

import { observer } from 'mobx-react-lite'
import { DefiningArea } from '../../../../../lib/triggers/keyDisplay'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { ProjectContext } from '../../../../contexts/Project'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'
import { StreamdeckSettings } from './streamdeck'
import { XKeysSettings } from './xkeys'
import { TrashBtn } from '../../../../components/inputs/TrashBtn'

export const PeripheralSettings: React.FC<{
	bridgeId: string
	deviceId: string
	peripheral: PeripheralStatus
	onDisconnect: () => void
}> = observer(function PeripheralSettings({ bridgeId, deviceId, peripheral, onDisconnect }) {
	const { handleError } = useContext(ErrorHandlerContext)
	const serverAPI = useContext(IPCServerContext)
	const project = useContext(ProjectContext)

	const definingArea = useMemoComputedObject(() => {
		return store.guiStore.definingArea
	}, [store.guiStore.definingArea])

	const createNewArea = useCallback(() => {
		serverAPI.addPeripheralArea({ bridgeId, deviceId }).catch(handleError)
	}, [serverAPI, handleError, bridgeId, deviceId])
	const removeArea = useCallback(
		(areaId: string) => {
			serverAPI.removePeripheralArea({ bridgeId, deviceId, areaId }).catch(handleError)
		},
		[serverAPI, handleError, bridgeId, deviceId]
	)

	const startDefiningArea = useCallback(
		(areaId: string) => {
			const defArea: DefiningArea = {
				bridgeId,
				deviceId,
				areaId,
			}
			serverAPI.startDefiningArea(defArea).catch(handleError)
		},
		[bridgeId, deviceId, handleError, serverAPI]
	)
	const finishDefiningArea = useCallback(() => {
		serverAPI.finishDefiningArea().catch(handleError)
	}, [handleError, serverAPI])

	const bridge = project.bridges[bridgeId]

	const disconnect = useCallback(() => {
		bridge.settings.peripherals[deviceId].manualConnect = false
		serverAPI.updateProject({ id: project.id, project }).catch(handleError)
		onDisconnect()
	}, [bridge.settings.peripherals, deviceId, handleError, onDisconnect, project, serverAPI])

	if (!bridge) return null

	const peripheralSettings = bridge.clientSidePeripheralSettings[deviceId]

	return (
		<div className="peripheral-settings">
			<div>Name: {peripheral.info.name}</div>

			<div className="peripheral-settings__popover__settings">
				{peripheral.info.gui.type === 'streamdeck' && (
					<StreamdeckSettings
						bridgeId={bridgeId}
						deviceId={deviceId}
						peripheral={peripheral}
						definingArea={definingArea}
					/>
				)}
				{peripheral.info.gui.type === 'xkeys' && (
					<XKeysSettings
						bridgeId={bridgeId}
						deviceId={deviceId}
						peripheral={peripheral}
						definingArea={definingArea}
					/>
				)}
			</div>
			<div className="peripheral-settings__areas">
				{definingArea && (
					<Box className="message" sx={{ maxWidth: 'fit-content', p: 1, my: 1, bgcolor: 'info.main' }}>
						Press the buttons in order, to add them to the Button Area
					</Box>
				)}
				<Box sx={{ mt: 1 }}>
					{Object.entries(peripheralSettings?.areas || []).map(([areaId, area]) => {
						return (
							<Grid container key={areaId}>
								<Grid item xs={2}>
									{area.name}
								</Grid>
								<Grid item xs={3}>
									{area.identifiers.length} buttons
								</Grid>
								<Grid item xs={7} textAlign="right">
									{definingArea?.areaId === areaId ? (
										<Button
											className="btn"
											variant="contained"
											size="small"
											sx={{ mr: 1 }}
											onClick={() => finishDefiningArea()}
										>
											Finish
										</Button>
									) : (
										<Button
											className="btn"
											variant="outlined"
											size="small"
											sx={{ mr: 1 }}
											disabled={!!definingArea}
											onClick={() => startDefiningArea(areaId)}
										>
											{area.identifiers.length > 0 ? 'Clear and re-define' : 'Define keys'}
										</Button>
									)}
									<TrashBtn
										className="delete"
										title={'Delete Area'}
										onClick={() => removeArea(areaId)}
									/>
								</Grid>
							</Grid>
						)
					})}
				</Box>
				<Box sx={{ mt: 1 }}>
					<Button className="btn" variant="contained" color="primary" onClick={() => createNewArea()}>
						Create new button Area
					</Button>
				</Box>
				<Box sx={{ mt: 1 }}>
					<Button
						className="btn"
						variant="contained"
						color="primary"
						onClick={() => disconnect()}
						disabled={bridge.settings.autoConnectToAllPeripherals}
					>
						{bridge.settings.autoConnectToAllPeripherals ? 'Auto-connect is on' : 'Disconnect'}
					</Button>
				</Box>
			</div>
		</div>
	)
})
