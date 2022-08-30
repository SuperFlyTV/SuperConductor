import { TimelineObj } from './TimelineObj'
import { RundownTrigger } from './Trigger'

export interface PartBase {
	id: string
	name: string

	/** Disables the ability to play out the Part. */
	disabled?: boolean
	loop?: boolean
	/** Disables the ability to edit the Part in GUI. Does not affect ability to play out. */
	locked?: boolean

	triggers: RundownTrigger[]

	duration?: number

	resolved: {
		/** Duration of the part, derived by resolving the timeline in the Part  */
		duration: number | null // null means infinite
		/** Label of the part (derived from the name/timeline of the Part) */
		label: string
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
