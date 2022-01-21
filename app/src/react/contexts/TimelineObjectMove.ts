import React from 'react'

export const TimelineObjectMoveContext = React.createContext<{
	move: TimelineObjectMove
	updateMove: (newGui: Partial<TimelineObjectMove>) => void
}>({
	move: {},
	updateMove: () => {},
})

export interface TimelineObjectMove {
	dragDelta?: number
}
