import { BridgeStatus } from '@/models/project/Bridge'
import classNames from 'classnames'
import React from 'react'

export const TopHeader: React.FC<{
	rundowns: { rundownId: string; name: string }[]
	bridgeStatuses: { [bridgeId: string]: BridgeStatus }
	onSelect: (rundownId: string) => void
}> = ({ rundowns, bridgeStatuses, onSelect }) => {
	return (
		<>
			{rundowns.map((rundown) => {
				return (
					<div
						key={rundown.rundownId}
						className="tab"
						onClick={() => {
							onSelect(rundown.rundownId)
						}}
					>
						{rundown.name}
					</div>
				)
			})}

			{Object.entries(bridgeStatuses).map(([bridgeId, bridgeStatus]) => {
				return Object.entries(bridgeStatus.devices).map(([deviceId, deviceStatus]) => {
					return (
						<div
							key={`${bridgeId}_${deviceId}`}
							className={classNames('device-status', { ok: bridgeStatus.connected && deviceStatus.ok })}
							title={bridgeStatus.connected ? deviceStatus.message : 'Bridge is disconnected'}
						>
							{deviceId}

							<div className="device-status__dot"></div>
						</div>
					)
				})
			})}
		</>
	)
}
