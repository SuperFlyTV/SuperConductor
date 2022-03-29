import React, { useState } from 'react'
import { Bridge, BridgeStatus } from '../../../../../models/project/Bridge'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { DevicesList } from '../deviceItem/DevicesList'
import { TextBtn } from '../../../../components/inputs/textBtn/TextBtn'
import { NewDeviceDialog } from '../../../settings/devices/NewDeviceDialog'

import './style.scss'

export const BridgeItemContent: React.FC<{
	id: string
	bridge: Bridge
	bridgeStatus: BridgeStatus
	isInternal?: boolean
}> = (props) => {
	const [addDeviceOpen, setAddDeviceOpen] = useState(false)

	return (
		<div className="content">
			{!props.isInternal && <div>Non-Internal Bridge</div>}
			<RoundedSection title="Devices" controls={<TextBtn label="Add" onClick={() => setAddDeviceOpen(true)} />}>
				<DevicesList bridge={props.bridge} devices={props.bridgeStatus ? props.bridgeStatus.devices : {}} />
			</RoundedSection>

			<NewDeviceDialog
				bridge={props.bridge}
				open={addDeviceOpen}
				onAccepted={() => setAddDeviceOpen(false)}
				onDiscarded={() => {
					setAddDeviceOpen(false)
				}}
			/>
		</div>
	)
}
