import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Button } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { DefiningArea } from '../../../../../lib/triggers/keyDisplay'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { ProjectContext } from '../../../../contexts/Project'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'
import { StreamdeckSettings } from './streamdeck'

export const PeripheralSettings: React.FC<{
	bridgeId: string
	deviceId: string
	peripheral: PeripheralStatus
}> = observer(function PeripheralSettings({ bridgeId, deviceId, peripheral }) {
	const { handleError } = useContext(ErrorHandlerContext)
	const serverAPI = useContext(IPCServerContext)
	const project = useContext(ProjectContext)

	const definingArea = useMemoComputedObject(() => {
		return store.guiStore.definingArea
	}, [store.guiStore.definingArea])

	const createNewArea = useCallback(() => {
		serverAPI.addPeripheralArea({ bridgeId, deviceId }).catch(handleError)
	}, [serverAPI, handleError, bridgeId, deviceId])

	const startDefiningArea = useCallback(
		(areaId: string) => {
			const defArea: DefiningArea = {
				bridgeId,
				deviceId,
				areaId,
			}
			serverAPI.startDefiningArea(defArea).catch(handleError)
		},
		[bridgeId, deviceId]
	)
	const finishDefiningArea = useCallback(() => {
		serverAPI.finishDefiningArea({}).catch(handleError)
	}, [])

	const bridge = project.bridges[bridgeId]
	if (!bridge) return null

	const peripheralSettings = bridge.peripheralSettings[deviceId]

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
				{/* {peripheral.info.gui.type === 'xkeys' && <div>To be implemented </div>} */}
			</div>
			<div className="peripheral-settings__areas">
				<div>{definingArea && 'Press the buttons in order, to add them to the Button Area'}</div>
				<table>
					<tbody>
						{Object.entries(peripheralSettings?.areas || []).map(([areaId, area]) => {
							return (
								<tr key={areaId}>
									<td>{area.name}</td>
									<td>{area.identifiers.length} buttons</td>
									<td>
										{definingArea?.areaId === areaId ? (
											<Button
												className="btn"
												variant="contained"
												onClick={() => finishDefiningArea()}
											>
												Finish
											</Button>
										) : (
											<Button
												className="btn"
												variant="contained"
												disabled={!!definingArea}
												onClick={() => startDefiningArea(areaId)}
											>
												{area.identifiers.length > 0
													? 'Clear and re-define keys'
													: 'Define keys'}
											</Button>
										)}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
				<div>
					<Button className="btn" variant="contained" onClick={() => createNewArea()}>
						Create new button Area
					</Button>
				</div>
			</div>
		</div>
	)
})
