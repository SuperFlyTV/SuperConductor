/*
	A Trigger defines something that invokes an Action.
	So it could be a keyboard key, a streamdeck button etc (- or a key-combination).
*/

export interface AnyTrigger {
	/** The trigger(s) associated with this action. Multiple values indicate a "key-combination". */
	fullIdentifiers: string[]
	/** Label of the Trigger, for example "CTRL+F". Multiple labels are separated by "+" */
	label: string
	/** If true, this trigger works even when the window does not have focus.
	 * Modifiers used on global triggers (Shift, Alt, Ctrl, Command, etc) may behave differently than on non-global triggers.
	 * Only applies to keyboard triggers, peripheral triggers are always global.
	 * Global triggers may silently fail to register if already taken by another application.
	 * See https://www.electronjs.org/docs/latest/api/global-shortcut for more information. */
	isGlobalKeyboard: boolean
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
