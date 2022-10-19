import { Mappings, Datastore } from 'timeline-state-resolver-types'
import { ActiveAnalog } from '../rundown/Analog'
import { Bridge } from './Bridge'

export interface Project {
	id: string
	name: string

	mappings: Mappings
	bridges: {
		[bridgeId: string]: Bridge
	}
	datastoreActions: DatastoreActions

	deviceNames: { [deviceId: string]: string }

	settings: Settings

	autoRefreshInterval?: number
}

export interface Settings {
	enableInternalBridge: boolean
}

export interface DatastoreActions {
	[datastoreKey: string]: DatastoreAction
}
export interface DatastoreAction {
	label: string

	value: number
	modified: number

	analog: ActiveAnalog | null
	// TODO: relative vs absolute thing
}

function generateDatastore(project: Project): Datastore {
	const datastore: Datastore = {}

	for (const [datastoreKey, datastoreAction] of Object.entries(project.datastoreActions)) {
		datastore[datastoreKey] = {
			value: datastoreAction.value,
			modified: datastoreAction.modified,
		}
	}
	return datastore
}
