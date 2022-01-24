import { Mappings } from 'timeline-state-resolver-types'
import { Bridge } from './Bridge'

export interface Project {
	id: string
	name: string

	mappings: Mappings
	bridges: {
		[bridgeId: string]: Bridge
	}

	settings: Settings
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Settings {
	// TODO: add settings
}
