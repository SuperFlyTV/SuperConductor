import { PeripheralInfo } from '@shared/api'

export interface Peripheral {
	id: string
	bridgeId: string

	info: PeripheralInfo

	status: {
		connected: boolean
		/** Timestamp */
		lastConnected: number
	}
}
