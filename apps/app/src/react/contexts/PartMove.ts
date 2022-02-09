import React from 'react'

export const PartMoveContext = React.createContext<{
	partMove: PartMove
	updatePartMove: (newGui: Partial<PartMove>) => void
}>({
	partMove: {
		duplicate: null,
		partId: null,
		fromGroupId: null,
		toGroupId: null,
		position: null,
		moveId: null,
		done: null,
	},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	updatePartMove: () => {},
})

export interface PartMove {
	/** Whether to make a duplicate of the moved part or not. null = no move */
	duplicate: null | boolean
	/** The ID of the part being moved. null = no move */
	partId: null | string
	/** The ID of the group that the part is being moved from. null = no move  */
	fromGroupId: null | string
	/** The ID of the group that the part is being moved to. null = create a new transparent group */
	toGroupId: null | string
	/** The position that the part is being moved to. null = no move */
	position: null | number
	/** A unique ID for each move transaction. null = no move */
	moveId: null | string
	/** True = the move associated with the current moveId is complete and can be sent to the backend. null = no move */
	done: null | boolean
}
