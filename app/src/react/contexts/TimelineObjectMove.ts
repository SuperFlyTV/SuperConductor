import React from 'react'

export const TimelineObjectMoveContext = React.createContext<{
	move: TimelineObjectMove
	updateMove: (newGui: Partial<TimelineObjectMove>) => void
}>({
	move: { isMoving: false, wasMoved: false },
	updateMove: () => {},
})

export interface TimelineObjectMove {
	isMoving: boolean
	wasMoved: boolean
	dragDelta?: number
}
