import { ActiveAnalog } from '../rundown/Analog'

export interface AnalogStore {
	analogs: {
		[fullIdentifier: string]: {
			value: number
			modified: number

			analog: ActiveAnalog
		}
	}
}
