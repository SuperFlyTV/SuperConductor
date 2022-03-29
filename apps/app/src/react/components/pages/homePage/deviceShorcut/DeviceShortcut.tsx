/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { BridgeDevice } from 'src/models/project/Bridge'
import { DeviceType } from 'timeline-state-resolver-types'
import casparcg from '../../../../../img/casparcg.png'
import vmix from '../../../../../img/vmix.png'
import { StatusCircle } from '../scList/StatusCircle'

import './style.scss'

export const DeviceShortcut: React.FC<{ device: BridgeDevice; type: DeviceType }> = (props) => {
	const statusMessage = props.device.ok ? 'Connected' : props.device.message ? props.device.message : 'Not Connected'

	const type = props.type

	let iconElement = <span>{type}</span>
	switch (type) {
		case DeviceType.CASPARCG:
			iconElement = <img src={casparcg} alt="CasparCG" />
			break
		case DeviceType.VMIX:
			iconElement = <img src={vmix} alt="vMix" />
			break
	}

	return (
		<div className="device-shortcut" title={statusMessage}>
			<StatusCircle status={props.device.ok ? 'connected' : 'disconnected'} />
			{iconElement}
		</div>
	)
}
