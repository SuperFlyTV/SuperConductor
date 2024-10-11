import { Stack, Typography } from '@mui/material'
import { BridgeId, KnownPeripheral, PeripheralId } from '@shared/api'
import React, { useCallback, useContext } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ProjectContext } from '../../../../contexts/Project.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'

import './style.scss'
import { DeviceIcon } from '../../../pages/homePage/deviceIcon/DeviceIcon.js'
import { unprotectString } from '@shared/models'

export interface DisabledPeripheralInfo {
	bridgeId: BridgeId
	deviceId: PeripheralId
	info: KnownPeripheral
}

export const DisabledPeripheralsSettings: React.FC<{
	peripherals: DisabledPeripheralInfo[]
	onPeripheralClicked?: () => void
}> = function DeviceStatuses({ peripherals, onPeripheralClicked }) {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const toggleManualConnect = useCallback(
		(peripheral?: DisabledPeripheralInfo) => {
			if (!peripheral) return
			const peripheralSettings =
				project.bridges[unprotectString<BridgeId>(peripheral.bridgeId)].settings.peripherals[
					unprotectString<PeripheralId>(peripheral.deviceId)
				]
			peripheralSettings.manualConnect = !peripheralSettings.manualConnect
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
		},
		[handleError, ipcServer, project]
	)

	return (
		<Stack className="disabled-peripherals">
			<Typography>Select a panel to connect to:</Typography>
			{peripherals.map((peripheral) => (
				<a
					key={`${peripheral.bridgeId}-${peripheral.deviceId}`}
					onClick={() => {
						toggleManualConnect(peripheral)
						onPeripheralClicked?.()
					}}
				>
					<DeviceIcon type={peripheral.info.type} />
					{peripheral.info.name}
				</a>
			))}
		</Stack>
	)
}
