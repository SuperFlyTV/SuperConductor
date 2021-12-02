import { DeviceOptionsAny } from 'timeline-state-resolver-types'

export interface Bridge {
	id: string
	name: string

	outgoing: boolean

	url: string

	settings: {
		devices: {
			[deviceId: string]: DeviceOptionsAny
		}
	}
}

export interface BridgeStatus {
	connected: boolean

	devices: {} // todo: add device statuses?
}
