import { Mappings } from 'timeline-state-resolver-types'
import { Bridge } from './Bridge'

export interface Project {
	name: string

	mappings: Mappings
	bridges: {
		[bridgeId: string]: Bridge
	}

	settings: Settings
}

export interface Settings {
	// TODO: add settings
}
