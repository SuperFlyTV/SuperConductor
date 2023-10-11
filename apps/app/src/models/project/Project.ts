import { Mappings } from 'timeline-state-resolver-types'
import { Bridge } from './Bridge'

export interface ProjectBase {
	id: string
	name: string
}

export interface Project extends ProjectBase {
	mappings: Mappings
	bridges: {
		[BridgeId: string]: Bridge
	}
	analogInputSettings: AnalogInputSettings

	deviceNames: { [TSRDeviceId: string]: string }

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
