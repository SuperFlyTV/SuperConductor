import React, { useContext } from 'react'
import { GroupGUI } from '../../../../models/rundown/Group'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { Box, Button } from '@mui/material'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { PeripheralArea, PeripheralStatus } from '../../../../models/project/Peripheral'
import { useMemoComputedObject } from '../../../mobx/lib'
import { getPeripheralId } from '@shared/lib'
import { BridgeId, PeripheralId } from '@shared/api'
import { protectString } from '@shared/models'

export const GroupButtonAreaPopover: React.FC<{ group: GroupGUI }> = observer(function GroupButtonAreaPopover({
	group,
}) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const project = store.projectStore.project
	const appStore = store.appStore

	const allAreas = useMemoComputedObject(() => {
		const allAreas0: {
			bridgeId: BridgeId
			deviceId: PeripheralId
			areaId: string
			area: PeripheralArea
			peripheralStatus: PeripheralStatus | undefined
		}[] = []
		for (const [bridgeId0, bridge] of Object.entries(project.bridges)) {
			const bridgeId = protectString<BridgeId>(bridgeId0)
			for (const [deviceId0, peripheralSettings] of Object.entries(bridge.clientSidePeripheralSettings)) {
				const deviceId = protectString<PeripheralId>(deviceId0)

				for (const [areaId, area] of Object.entries(peripheralSettings.areas)) {
					const peripheralId = getPeripheralId(bridgeId, deviceId)
					const peripheralStatus = appStore.peripherals.get(peripheralId)

					allAreas0.push({ area, areaId, bridgeId, deviceId, peripheralStatus })
				}
			}
		}

		allAreas0.sort((a, b) => {
			if (a.peripheralStatus && !b.peripheralStatus) return -1
			if (!a.peripheralStatus && b.peripheralStatus) return 1

			return 0
		})

		return allAreas0
	}, [project])

	return (
		<Box sx={{ p: 1 }}>
			Assign a Button Area to this Group:
			<table className="table">
				<tbody>
					<tr>
						<th>Device</th>
						<th>Area</th>
						<th>Buttons</th>
						<th></th>
					</tr>
					{allAreas.map(({ area, areaId, bridgeId, deviceId, peripheralStatus }) => {
						const deviceName = peripheralStatus ? peripheralStatus.info.name : <i>(Device-not-connected)</i>

						return (
							<tr key={areaId}>
								<td>{deviceName}</td>
								<td>{area.name}</td>
								<td>{area.identifiers.length} buttons</td>
								<td>{area.assignedToGroupId === group.id && 'Assigned to this group'}</td>
								<td>
									{area.assignedToGroupId === group.id ? (
										<Button
											variant="contained"
											size="small"
											color="warning"
											onClick={() => {
												ipcServer
													.assignAreaToGroup({
														groupId: undefined,
														areaId,
														bridgeId,
														deviceId,
													})
													.catch(handleError)
											}}
										>
											Remove
										</Button>
									) : (
										<Button
											variant="contained"
											size="small"
											onClick={() => {
												ipcServer
													.assignAreaToGroup({
														groupId: group.id,
														areaId,
														bridgeId,
														deviceId,
													})
													.catch(handleError)
											}}
										>
											Assign
										</Button>
									)}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
		</Box>
	)
})
