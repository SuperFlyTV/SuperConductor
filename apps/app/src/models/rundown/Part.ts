import { TimelineObj } from './TimelineObj'
import { Trigger } from './Trigger'

export type Part = {
	id: string
	name: string
	timeline: TimelineObj[]
	disabled?: boolean
	loop?: boolean
	locked?: boolean

	triggers: Trigger[]

	resolved: {
		duration: number | null // null means infinite
	}
}
