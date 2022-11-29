import { AnalogValue } from '@shared/api'
/*
	An Analog defines an external analog value
	So it could be a jog-wheel, a T-bar etc
*/

export interface ActiveAnalog {
	fullIdentifier: string
	bridgeId: string
	deviceId: string
	deviceName: string
	identifier: string
	value: AnalogValue
}
