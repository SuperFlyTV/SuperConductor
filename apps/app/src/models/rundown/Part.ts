import { TimelineObj } from './TimelineObj'

export type Part = {
	id: string
	name: string
	timeline: TimelineObj[]

	resolved: {
		duration: number
	}
}
