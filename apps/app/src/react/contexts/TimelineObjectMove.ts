import React from 'react'

export const TimelineObjectMoveContext = React.createContext<{
	move: TimelineObjectMove
	updateMove: (newGui: Partial<TimelineObjectMove>) => void
}>({
	move: { isMoving: false, wasMoved: false },
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	updateMove: () => {},
})

export interface TimelineObjectMove {
	isMoving: boolean
	wasMoved: boolean
	dragDelta?: number
}
