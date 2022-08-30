import { Mappings } from 'timeline-state-resolver-types'
import { ProjectAction } from '../../lib/triggers/action'
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

	actions: ProjectAction[]
}

export interface Settings {
	enableInternalBridge: boolean
}
