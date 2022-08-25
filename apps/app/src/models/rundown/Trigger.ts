export interface Trigger {
	/** The trigger(s) associated with this action. Multiple values indicate a "key-combination". */
	fullIdentifiers: string[]
	action: 'play' | 'stop' | 'playStop'
	label: string
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
