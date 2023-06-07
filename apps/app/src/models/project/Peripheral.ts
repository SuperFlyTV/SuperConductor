import { BridgeId, PeripheralId, PeripheralInfo } from '@shared/api'
import { RundownTrigger } from '../rundown/Trigger'
import { protectString } from '@shared/models'

export interface PeripheralStatus {
	id: PeripheralId
	bridgeId: BridgeId

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
	action: RundownTrigger['action']
}

export const PERIPHERAL_KEYBOARD = protectString(`keyboard`)
