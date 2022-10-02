import React, { useContext, useCallback } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { ScListItemLabel } from '../scList/ScListItemLabel'
import { StatusCircle } from '../scList/StatusCircle'
import { Stack } from '@mui/material'
import { AvailablePeripheral, PeripheralSettingsAny } from '@shared/api'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import Toggle from 'react-toggle'
import 'react-toggle/style.css'

export const PeripheralItemHeader: React.FC<{
	disableManualConnectToggle: boolean
	settings: PeripheralSettingsAny
	status: AvailablePeripheral
	otherStatus?: PeripheralStatus
}> = ({ disableManualConnectToggle, settings, status, otherStatus }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const togglePeripheralManualConnect = useCallback(
		(peripheralSettings?: PeripheralSettingsAny) => {
			if (!peripheralSettings) return
			peripheralSettings.manualConnect = !peripheralSettings.manualConnect
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, project]
	)

	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<StatusCircle status={otherStatus && otherStatus.status.connected ? 'connected' : 'disconnected'} />
			<ScListItemLabel title={status.name} />
			<label style={{ marginLeft: '2rem' }}>Connect</label>
			<div className="sc-switch">
				<Toggle
					disabled={disableManualConnectToggle}
					checked={!!settings?.manualConnect}
					onChange={() => {
						togglePeripheralManualConnect(settings)
					}}
				/>
			</div>
		</Stack>
	)
}
