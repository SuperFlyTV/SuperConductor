import { AvailablePeripheral, PeripheralSettings_Any } from '@shared/api'
import { DeviceOptionsAny } from 'timeline-state-resolver-types'
import { PeripheralArea } from './Peripheral'

export interface Bridge {
	id: string
	name: string

	outgoing: boolean

	url: string

	settings: {
		devices: {
			[deviceId: string]: DeviceOptionsAny
		}
		peripherals: {
			[peripheralId: string]: PeripheralSettings_Any
		}
		autoConnectToAllPeripherals: boolean
	}

	clientSidePeripheralSettings: {
		[peripheralId: string]: BridgePeripheralSettings
	}
}

export interface BridgeStatus {
	connected: boolean

	devices: {
		[deviceId: string]: BridgeDevice
	}

	peripherals: {
		[peripheralId: string]: BridgePeripheral
	}
}

export interface BridgeDevice {
	connectionId: number
	ok: boolean
	message: string
}

export type BridgePeripheral = AvailablePeripheral

export interface BridgePeripheralSettings {
	// overrideName?: string

	areas: {
		[areaId: string]: PeripheralArea
	}
}

export const INTERNAL_BRIDGE_ID = '__INTERNAL__'
