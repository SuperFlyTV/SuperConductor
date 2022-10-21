import { ActiveAnalog } from '../rundown/Analog'

export interface AnalogInputs {
	analogs: {
		[fullIdentifier: string]: AnalogInput
	}
}

export interface AnalogInput {
	/** A reference to Project.analogInputSettings */
	datastoreKey: string

	value: number
	modified: number

	activeAnalog: ActiveAnalog
}
