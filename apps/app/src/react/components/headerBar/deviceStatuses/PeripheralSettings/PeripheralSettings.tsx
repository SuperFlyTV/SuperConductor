import React, { useCallback, useContext, useState } from 'react'
import { Button } from '@mui/material'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { ProjectContext } from '../../../../contexts/Project'
import { StreamdeckSettings } from './streamdeck'

export const PeripheralSettings: React.FC<{
	bridgeId: string
	peripheralId: string
	peripheral: PeripheralStatus
}> = ({ bridgeId, peripheralId, peripheral }) => {
	const { handleError } = useContext(ErrorHandlerContext)
	const serverAPI = useContext(IPCServerContext)
	const project = useContext(ProjectContext)

	const createNewArea = useCallback(() => {
		serverAPI.addPeripheralArea({ bridgeId, peripheralId }).catch(handleError)
	}, [serverAPI, handleError, bridgeId, peripheralId])

	const [isDefiningArea, setIsDefiningArea] = useState<string | undefined>(undefined)
	const startDefiningArea = useCallback(
		(areaId: string) => {
			serverAPI
				.startDefiningArea({
					bridgeId,
					peripheralId,
					areaId,
				})
				.catch(handleError)
			setIsDefiningArea(areaId)
		},
		[bridgeId, peripheralId]
	)
	const finishDefiningArea = useCallback(() => {
		serverAPI
			.finishDefiningArea({
				bridgeId,
				peripheralId,
			})
			.catch(handleError)

		setIsDefiningArea(undefined)
	}, [])

	const bridge = project.bridges[bridgeId]
	if (!bridge) return null

	const peripheralSettings = bridge.peripheralSettings[peripheralId]

	return (
		<div className="peripheral-settings">
			<div>Name: {peripheral.info.name}</div>

			<div className="peripheral-settings__popover__settings">
				{peripheral.info.gui.type === 'streamdeck' && (
					<StreamdeckSettings peripheralId={peripheralId} peripheral={peripheral} />
				)}
				{/* {peripheral.info.gui.type === 'xkeys' && <div>To be implemented </div>} */}
			</div>
			<div className="peripheral-settings__areas">
				<div>{isDefiningArea && 'Press the'}</div>
				<table>
					<tbody>
						{Object.entries(peripheralSettings?.areas || []).map(([areaId, area]) => {
							return (
								<tr key={areaId}>
									<td>{area.name}</td>
									<td>{area.identifiers.length} buttons</td>
									<td>
										{isDefiningArea ? (
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
}
