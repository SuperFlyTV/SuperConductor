import { TimelineObj } from './TimelineObj'
import { Trigger } from './Trigger'

export type Part = {
	id: string
	name: string
	timeline: TimelineObj[]
	/** Disables the ability to play out the Part. */
	disabled?: boolean
	loop?: boolean
	/** Disables the ability to edit the Part in GUI. Does not affect ability to play out. */
	locked?: boolean

	triggers: Trigger[]

	resolved: {
		duration: number | null // null means infinite
	}
}
