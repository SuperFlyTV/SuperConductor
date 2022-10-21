import { Mappings, Datastore } from 'timeline-state-resolver-types'
import { AnalogInput, AnalogInputs } from './AnalogInput'
import { Bridge } from './Bridge'

export interface Project {
	id: string
	name: string

	mappings: Mappings
	bridges: {
		[bridgeId: string]: Bridge
	}
	analogInputSettings: AnalogInputSettings

	deviceNames: { [deviceId: string]: string }

	settings: Settings

	autoRefreshInterval?: number
}

export interface Settings {
	enableInternalBridge: boolean
}

export interface AnalogInputSettings {
	[datastoreKey: string]: AnalogInputSetting
}
export interface AnalogInputSetting {
	label: string

	/** Reference to an entry in the AnalogStore */
	fullIdentifier: string | null

	/** Whether to update the analog value using the absolute or the relative analog value. */
	updateUsingAbsolute?: boolean
	scaleFactor?: number
	relativeMinCap?: number
	relativeMaxCap?: number
	absoluteOffset?: number
}
