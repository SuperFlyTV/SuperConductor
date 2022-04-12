import { PeripheralInfo } from '@shared/api'

export interface PeripheralStatus {
	id: string
	bridgeId: string

	info: PeripheralInfo

	status: {
		connected: boolean
		/** Timestamp */
		lastConnected: number
	}
}
export interface PeripheralSettings {
	// overrideName?: string

	areas: {
		[areaId: string]: PeripheralArea
	}
}

export interface PeripheralArea {
	name: string
	identifiers: string[]
}
