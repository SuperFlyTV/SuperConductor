import { Group } from './Group'

export interface RundownBase {
	id: string
	name: string
}
export interface Rundown extends RundownBase {
	groups: Group[]
}
export interface RundownGUI extends RundownBase {
	groupIds: string[]
}
export function isRundown(rundown: RundownBase): rundown is Rundown {
	return !!(rundown as any as Rundown).groups
}
export function isRundownGUI(rundown: RundownBase): rundown is RundownGUI {
	return !!(rundown as any as RundownGUI).groupIds
}
