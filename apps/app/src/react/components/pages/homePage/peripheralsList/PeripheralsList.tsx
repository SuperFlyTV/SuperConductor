import { observer } from 'mobx-react-lite'
import React from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { ScList } from '../scList/ScList'
import { store } from '../../../../mobx/store'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { PeripheralItemHeader } from '../peripheralItem/PeripheralItemHeader'

export const PeripheralsList: React.FC<{
	autoConnectToAllPeripherals: boolean
	bridgeId: string
	statuses: BridgeStatus['peripherals']
	settings: Bridge['settings']['peripherals']
}> = observer(function PeripheralsList(props) {
	const appStore = store.appStore

	if (Object.keys(props.statuses).length === 0) {
		return <div className="central">There are no peripherals.</div>
	}

	return (
		<div className="peripherals-list">
			<ScList
				list={Object.entries(props.statuses).map(([peripheralId, status]) => {
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
							<PeripheralItemHeader
								key={peripheralId}
								autoConnectToAllPeripherals={props.autoConnectToAllPeripherals}
								settings={peripheralSettings}
								status={status}
								otherStatus={otherStatus}
							/>
						),
					}
				})}
			/>
			{}
		</div>
	)
})
