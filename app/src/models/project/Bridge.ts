import { DeviceOptionsAny } from 'timeline-state-resolver-types'

export interface Bridge {
	connected: boolean

	name: string
	connection: BridgeConnection

	settings: {
		devices: {
			[deviceId: string]: any // DeviceOptionsAnyInternal
		}
	}
}

export type BridgeConnection = BridgeConnectionIncoming | BridgeConnectionOutgoing
interface BridgeConnectionBase {
	type: 'incoming' | 'outgoing'
}

/** When a TSR-bridge connects to us */
export interface BridgeConnectionIncoming extends BridgeConnectionBase {
	type: 'incoming'
}
/** When we connect to a TSR-bridge */
export interface BridgeConnectionOutgoing extends BridgeConnectionBase {
	type: 'outgoing'

	url: string
}
