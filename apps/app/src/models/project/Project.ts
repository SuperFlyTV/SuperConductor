import { Mappings } from 'timeline-state-resolver-types'
import { ProjectTrigger } from '../rundown/Trigger'
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

	triggers: {
		[Key in ProjectTrigger['action']]?: ProjectTrigger[]
	}
}

export interface Settings {
	enableInternalBridge: boolean
}
