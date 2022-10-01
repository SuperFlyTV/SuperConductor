import { PeripheralInfo } from '@shared/api'
import { Trigger } from '../rundown/Trigger'

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

export interface PeripheralArea {
	name: string
	identifiers: string[]
	assignedToGroupId: string | undefined
	action: Trigger['action']
}
