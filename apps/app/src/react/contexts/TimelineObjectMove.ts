import React from 'react'

export const TimelineObjectMoveContext = React.createContext<{
	move: TimelineObjectMove
	updateMove: (newGui: Partial<TimelineObjectMove>) => void
}>({
	move: { moveType: null, wasMoved: null, partId: null, hoveredLayerId: null, moveId: null },
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	updateMove: () => {},
})

export interface TimelineObjectMove {
	/**
	 * The Type of move being performed
	 * null=not moving
	 * whole=start is moved, duration is unchanged
	 * duration=duration is moved, start is unchanged
	 * start=start is moved, end is unchanged (ie duration might change)
	 */
	moveType: null | 'whole' | 'duration' | 'start'
	/** When dragging to move, the delta to move [ms] */
	dragDelta?: number

	/** If dragging multiple timelineObjects, the one that the user "dragged with the mouse" */
	leaderTimelineObjId?: string
	/** Is true while (and just after) a move is done. Used to avoid a case where drag-end leads to a selection. */
	wasMoved: null | 'whole' | 'duration' | 'start'
	/** The ID of the Part in which this move is being performed. null = not moving */
	partId: null | string
	/** The corresponding layer ID of the layer element that the user's mouse is hovering over. null = not over a valid layer */
	hoveredLayerId: null | string
	/** The current client X position of the pointer [pixels] */
	pointerX?: number
	/** The current client Y position of the pointer [pixels] */
	pointerY?: number
	/** The origin client X position of the pointer when the move began [pixels] */
	originX?: number
	/** The origin client Y position of the pointer when the move began [pixels] */
	originY?: number
	/** Whether to make a duplicate of the moved timelineObj or not */
	duplicate?: boolean
	/** A unique identifier for each move transaction */
	moveId: null | string
}
