import { AnalogValue, BridgeId, PeripheralId } from '@shared/api'
/*
	An Analog defines an external analog value
	So it could be a jog-wheel, a T-bar etc
*/

export interface ActiveAnalog {
	fullIdentifier: string
	bridgeId: BridgeId
	deviceId: PeripheralId
	deviceName: string
	identifier: string
	value: AnalogValue
}
