export interface Trigger {
	/** The trigger(s) associated with this action. Multiple values indicate a "key-combination". */
	fullIdentifiers: string[]
	action: 'play' | 'stop'
}

export type ActiveTriggers = { [fullIdentifier: string]: true }
