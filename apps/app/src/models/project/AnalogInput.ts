import { ActiveAnalog } from '../rundown/Analog'

export interface AnalogInputs {
	analogs: {
		[fullIdentifier: string]: AnalogInput
	}
}

export interface AnalogInput {
	value: number
	modified: number

	activeAnalog: ActiveAnalog
}
