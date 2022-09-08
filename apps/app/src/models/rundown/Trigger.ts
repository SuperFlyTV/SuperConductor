export interface AnyTrigger {
	/** The trigger(s) associated with this action. Multiple values indicate a "key-combination". */
	fullIdentifiers: string[]
	/** Label of the Trigger, for example "CTRL+F". Multiple labels are separated by "+" */
	label: string
}
/** Defines a Trigger that is associated with a certain Part */
export interface RundownTrigger extends AnyTrigger {
	action: 'play' | 'stop' | 'playStop'
}
/**
 * Defines a Trigger that is associated with whatever is selected
 * in the current view (so it might be one or multiple Parts/Groups)
 */
export interface ApplicationTrigger extends AnyTrigger {
	action: 'play' | 'stop' | 'playStop' | 'pause' | 'delete' | 'next' | 'previous'
}

export interface ActiveTrigger {
	fullIdentifier: string
	bridgeId: string
	deviceId: string
	deviceName: string
	identifier: string
}
export type ActiveTriggers = ActiveTrigger[]

export function activeTriggersToString(triggers: ActiveTriggers): string {
	const strs: string[] = []

	let prevDeviceId = 'N/A'
	for (const trigger of triggers) {
		if (trigger.deviceId !== prevDeviceId) {
			strs.push(`${trigger.deviceName} ${trigger.identifier}`)
		} else {
			strs.push(`${trigger.identifier}`)
		}
		prevDeviceId = trigger.deviceId
	}

	return strs.join('+')
}
