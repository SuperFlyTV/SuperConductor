import { ActiveAnalog } from '../rundown/Analog'

export interface AnalogInputs {
	analogs: {
		[fullIdentifier: string]: AnalogInput
	}
}

export interface AnalogInput {
	/** A reference to Project.analogInputSettings */
	datastoreKey: string

	/** Calculated value */
	value: number
	/** Timestamp when was last modified */
	modified: number

	activeAnalog: ActiveAnalog
}
