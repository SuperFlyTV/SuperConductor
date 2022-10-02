import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext } from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { ScList } from '../scList/ScList'
import { Stack } from '@mui/material'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { store } from '../../../../mobx/store'

import Toggle from 'react-toggle'
import 'react-toggle/style.css'
import { PeripheralSettings_Any } from '@shared/api'
import { StatusCircle } from '../scList/StatusCircle'
import { ScListItemLabel } from '../scList/ScListItemLabel'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'

export const PeripheralsList: React.FC<{
	disableToggles: boolean
	bridgeId: string
	statuses: BridgeStatus['peripherals']
	settings: Bridge['settings']['peripherals']
}> = observer(function PeripheralsList(props) {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const appStore = store.appStore

	const togglePeripheralManualConnect = useCallback(
		(peripheralSettings?: PeripheralSettings_Any) => {
			if (!peripheralSettings) return
			peripheralSettings.manualConnect = !peripheralSettings.manualConnect
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, project]
	)

	if (Object.keys(props.statuses).length === 0) {
		return <div className="central">There are no peripherals.</div>
	}

	return (
		<div className="peripherals-list">
			<ScList
				list={Object.entries(props.statuses).map(([peripheralId, peripheral]) => {
					const peripheralSettings = props.settings[peripheralId]
					const otherStatus = appStore.peripherals[`${props.bridgeId}-${peripheralId}`] as
						| PeripheralStatus
						| undefined
					if (!peripheralSettings)
						return {
							id: peripheralId,
							header: null,
							content: null,
						}

					return {
						id: peripheralId,
						header: (
							<Stack direction="row" spacing={1} key={peripheralId} alignItems="center">
								<StatusCircle
									status={otherStatus && otherStatus.status.connected ? 'connected' : 'disconnected'}
								/>
								<ScListItemLabel title={peripheral.name} />
								<label style={{ marginLeft: '2rem' }}>Connect</label>
								<div className="sc-switch">
									<Toggle
										disabled={props.disableToggles}
										checked={!!peripheralSettings?.manualConnect}
										onChange={() => {
											togglePeripheralManualConnect(peripheralSettings)
										}}
									/>
								</div>
							</Stack>
						),
					}
				})}
			/>
			{}
		</div>
	)
})
