import { Stack, Typography } from '@mui/material'
import { KnownPeripheral } from '@shared/api'
import React, { useCallback, useContext } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ProjectContext } from '../../../../contexts/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'

import './style.scss'
import { DeviceIcon } from '../../../pages/homePage/deviceIcon/DeviceIcon'

export interface DisabledPeripheralInfo {
	bridgeId: string
	deviceId: string
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
			const peripheralSettings = project.bridges[peripheral.bridgeId].settings.peripherals[peripheral.deviceId]
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
						onPeripheralClicked && onPeripheralClicked()
					}}
				>
					<DeviceIcon type={peripheral.info.type} />
					{peripheral.info.name}
				</a>
			))}
		</Stack>
	)
}
