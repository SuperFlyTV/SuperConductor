import { AnalogValue } from '@shared/api'
/*
	An Analog defines an external analog value
	So it could be a jog-wheel, a T-bar etc
*/

// export interface AnyAnalog {
// 	/** The trigger(s) associated with this action. Multiple values indicate a "key-combination". */
// 	fullIdentifiers: string[]
// 	/** Label of the Trigger, for example "CTRL+F". Multiple labels are separated by "+" */
// 	label: string
// }
/** Defines a Trigger that is associated with a certain Part */
// export interface RundownTrigger extends AnyTrigger {
// 	action: 'play' | 'stop' | 'playStop'
// }
/**
 * Defines a Trigger that is associated with whatever is selected
 * in the current view (so it might be one or multiple Parts/Groups)
 */
// export interface ApplicationTrigger extends AnyTrigger {
// 	action: 'play' | 'stop' | 'playStop' | 'pause' | 'delete' | 'next' | 'previous'
// }

export interface ActiveAnalog {
	fullIdentifier: string
	bridgeId: string
	deviceId: string
	deviceName: string
	identifier: string
	value: AnalogValue
}
// export type ActiveTriggers = ActiveTrigger[]
