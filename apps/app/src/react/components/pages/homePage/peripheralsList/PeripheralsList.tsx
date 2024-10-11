import { observer } from 'mobx-react-lite'
import React from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge.js'
import { ScList } from '../scList/ScList.js'
import { store } from '../../../../mobx/store.js'
import { PeripheralItemHeader } from '../peripheralItem/PeripheralItemHeader.js'
import { getPeripheralId } from '@shared/lib'
import { protectString } from '@shared/models'
import { BridgeId, KnownPeripheral, PeripheralId } from '@shared/api'

export const PeripheralsList: React.FC<{
	autoConnectToAllPeripherals: boolean
	bridgeId: BridgeId
	statuses: BridgeStatus['peripherals']
	settings: Bridge['settings']['peripherals']
}> = observer(function PeripheralsList(props) {
	const appStore = store.appStore

	if (Object.keys(props.statuses).length === 0) {
		return (
			<div className="central">
				No panels connected.
				<br />
				Connected Streamdeck or X-keys panels will appear here.
			</div>
		)
	}

	return (
		<div className="peripherals-list">
			<ScList
				list={Object.entries<KnownPeripheral>(props.statuses).map(([peripheralId0, status]) => {
					const peripheralSettings = props.settings[peripheralId0]
					const peripheralId = protectString<PeripheralId>(peripheralId0)
					const otherStatus = appStore.peripherals.get(getPeripheralId(props.bridgeId, peripheralId))
					if (!peripheralSettings)
						return {
							id: peripheralId0,
							header: null,
							content: null,
						}

					return {
						id: peripheralId0,
						header: (
							<PeripheralItemHeader
								key={peripheralId0}
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
