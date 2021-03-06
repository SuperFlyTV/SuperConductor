import { TimelineObj } from './TimelineObj'
import { Trigger } from './Trigger'

export interface PartBase {
	id: string
	name: string

	/** Disables the ability to play out the Part. */
	disabled?: boolean
	loop?: boolean
	/** Disables the ability to edit the Part in GUI. Does not affect ability to play out. */
	locked?: boolean

	triggers: Trigger[]

	resolved: {
		duration: number | null // null means infinite
	}
	/** If this part was created from the AutoFill */
	autoFilled?: boolean
}
export interface Part extends PartBase {
	timeline: TimelineObj[]
}
export interface PartGUI extends PartBase {
	timelineIds: string[]
}
export function isPart(part: PartBase): part is Part {
	return !!(part as any as Part).timeline
}
export function isPartGUI(part: PartBase): part is PartGUI {
	return !!(part as any as PartGUI).timelineIds
}
