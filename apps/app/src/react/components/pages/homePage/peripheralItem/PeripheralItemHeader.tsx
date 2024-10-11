import React, { useContext, useCallback } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../contexts/Project.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import { ScListItemLabel } from '../scList/ScListItemLabel.js'
import { StatusCircle } from '../scList/StatusCircle.js'
import { KnownPeripheral, PeripheralSettingsAny } from '@shared/api'
import { PeripheralStatus } from '../../../../../models/project/Peripheral.js'
import Toggle from 'react-toggle'
import 'react-toggle/style.css'
import { DeviceIcon } from '../deviceIcon/DeviceIcon.js'

export const PeripheralItemHeader: React.FC<{
	autoConnectToAllPeripherals: boolean
	settings: PeripheralSettingsAny
	status: KnownPeripheral
	otherStatus?: PeripheralStatus
}> = ({ autoConnectToAllPeripherals, settings, status, otherStatus }) => {
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
		<div className="device-item-header">
			<div
				className="device-shortcut"
				title={otherStatus && otherStatus.status.connected ? 'Connected' : 'Disconnected'}
			>
				<StatusCircle status={otherStatus && otherStatus.status.connected ? 'connected' : 'disconnected'} />
				<DeviceIcon type={status.type} />
			</div>
			<ScListItemLabel title={status.name} />

			{autoConnectToAllPeripherals ? (
				<label>Auto-connected</label>
			) : (
				<>
					<label>Connect&nbsp;&nbsp;</label>
					<div className="sc-switch">
						<Toggle
							disabled={autoConnectToAllPeripherals}
							checked={!!settings?.manualConnect}
							onChange={() => {
								togglePeripheralManualConnect(settings)
							}}
						/>
					</div>
				</>
			)}
		</div>
	)
}
