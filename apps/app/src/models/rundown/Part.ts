import { TimelineObj } from './TimelineObj'
import { Trigger } from './Trigger'

export type Part = {
	id: string
	name: string
	timeline: TimelineObj[]

	triggers: Trigger[]

	resolved: {
		duration: number
	}
}
