import EventEmitter from 'events'
import { BridgeConnection } from '@/models/project/Bridge'
import { ResourceAny } from '@/models/resource/resource'

/** This handles connected bridges */
export abstract class BridgeHandler extends EventEmitter {
	constructor(protected connection: BridgeConnection) {
		super()
	}

	abstract updateResources(): Promise<ResourceAny[]>
}

/** When a TSR-bridge connects to us */
export class IncomingBridgeHandler extends BridgeHandler {
	constructor(connection: BridgeConnection) {
		super(connection)
	}
	async updateResources(): Promise<ResourceAny[]> {
		// todo
		return []
	}
}

/** When we connect to a TSR-bridge */
export class OutgoingBridgeHandler extends BridgeHandler {
	constructor(connection: BridgeConnection) {
		super(connection)
	}
	async updateResources(): Promise<ResourceAny[]> {
		// todo
		return []
	}
}
