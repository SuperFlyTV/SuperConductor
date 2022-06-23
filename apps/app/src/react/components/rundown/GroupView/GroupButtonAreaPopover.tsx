import React, { useContext } from 'react'
import { GroupGUI } from '../../../../models/rundown/Group'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { Button } from '@mui/material'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { PeripheralArea, PeripheralStatus } from '../../../../models/project/Peripheral'
import { useMemoComputedObject } from '../../../mobx/lib'

export const GroupButtonAreaPopover: React.FC<{ group: GroupGUI }> = observer(function GroupButtonAreaPopover({
	group,
}) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const project = store.projectStore.project
	const appStore = store.appStore

	const allAreas = useMemoComputedObject(() => {
		const allAreas0: {
			bridgeId: string
			deviceId: string
			areaId: string
			area: PeripheralArea
			peripheralStatus: PeripheralStatus | undefined
		}[] = []
		for (const [bridgeId, bridge] of Object.entries(project.bridges)) {
			for (const [deviceId, peripheralSettings] of Object.entries(bridge.peripheralSettings)) {
				for (const [areaId, area] of Object.entries(peripheralSettings.areas)) {
					const peripheralId = `${bridgeId}-${deviceId}`
					const peripheralStatus = appStore.peripherals[peripheralId] as PeripheralStatus | undefined

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
		<>
			<div>
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
							const deviceName = peripheralStatus ? (
								peripheralStatus.info.name
							) : (
								<i>(Device-not-connected)</i>
							)

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
			</div>
		</>
	)
})
