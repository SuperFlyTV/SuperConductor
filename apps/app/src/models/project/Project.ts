import { Mappings } from 'timeline-state-resolver-types'
import { Bridge } from './Bridge'

export interface Project {
	id: string
	name: string

	mappings: Mappings
	bridges: {
		[bridgeId: string]: Bridge
	}

	deviceNames: { [deviceId: string]: string }

	settings: Settings

	autoRefreshInterval?: number
}

export interface Settings {
	enableInternalBridge: boolean
}
