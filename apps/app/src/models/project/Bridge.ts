import { BridgeId, KnownPeripheral, PeripheralSettingsAny } from '@shared/api'
import { DeviceOptionsAny } from 'timeline-state-resolver-types'
import { PeripheralArea } from './Peripheral.js'
import { protectString } from '@shared/models'

export interface Bridge {
	id: BridgeId
	name: string

	outgoing: boolean

	url: string

	settings: {
		devices: {
			[TSRDeviceId: string]: DeviceOptionsAny
		}
		peripherals: {
			[PeripheralId: string]: PeripheralSettingsAny
		}
		autoConnectToAllPeripherals: boolean
	}

	clientSidePeripheralSettings: {
		[PeripheralId: string]: BridgePeripheralSettings
	}
}

export interface BridgeStatus {
	connected: boolean

	devices: {
		[TSRDeviceId: string]: BridgeDevice
	}

	peripherals: {
		[PeripheralId: string]: BridgePeripheral
	}
}

export interface BridgeDevice {
	connectionId: number
	ok: boolean
	message: string
}

export type BridgePeripheral = KnownPeripheral

export interface BridgePeripheralSettings {
	// overrideName?: string

	areas: {
		[areaId: string]: PeripheralArea
	}
}

export const INTERNAL_BRIDGE_ID = protectString<BridgeId>('__INTERNAL__')
