import { DeviceOptionsAny } from 'timeline-state-resolver-types'
import { PeripheralSettings } from './Peripheral'

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

	peripheralSettings: {
		[peripheralId: string]: PeripheralSettings
	}
}

export interface BridgeStatus {
	connected: boolean

	devices: {
		[deviceId: string]: BridgeDevice
	} // todo: add device statuses?
}

export interface BridgeDevice {
	connectionId: number
	ok: boolean
	message: string
}

export const INTERNAL_BRIDGE_ID = '__INTERNAL__'
