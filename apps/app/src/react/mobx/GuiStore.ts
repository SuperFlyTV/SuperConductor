import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */

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

export interface PartMove {
	/** NOT IMPLEMENTED YET - Whether to make a duplicate of the moved part or not. null = no move */
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

export interface GroupMove {
	/** The ID of the group being moved. null = no move */
	groupId: null | string
	/** The position that the group is being moved to. null = no move */
	position: null | number
	/** A unique ID for each move transaction. null = no move */
	moveId: null | string
	/** True = the move associated with the current moveId is complete and can be sent to the backend. null = no move */
	done: null | boolean
}

export type HomePageId = 'project' | 'bridgesSettings' | 'mappingsSettings'
export class GuiStore {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []

	activeTabId = 'home'
	activeHomePageId = 'project'

	partMove: PartMove = {
		duplicate: null,
		partId: null,
		fromGroupId: null,
		toGroupId: null,
		position: null,
		moveId: null,
		done: null,
	}

	groupMove: GroupMove = {
		groupId: null,
		position: null,
		moveId: null,
		done: null,
	}

	timelineObjMove: TimelineObjectMove = {
		moveType: null,
		wasMoved: null,
		partId: null,
		hoveredLayerId: null,
		moveId: null,
	}

	goToHome(pageId?: HomePageId) {
		this.activeTabId = 'home'
		if (pageId) this.activeHomePageId = pageId
	}

	isHomeSelected() {
		return this.activeTabId === 'home'
	}

	goToNewRundown() {
		this.activeTabId = 'new-rundown'
	}

	isNewRundownSelected() {
		return this.activeTabId === 'new-rundown'
	}

	updateTimelineObjMove(data: Partial<TimelineObjectMove>) {
		this.timelineObjMove = {
			...this.timelineObjMove,
			...data,
		}
	}

	updatePartMove(data: Partial<PartMove>) {
		this.partMove = {
			...this.partMove,
			...data,
		}
	}

	updateGroupMove(data: Partial<GroupMove>) {
		this.groupMove = {
			...this.groupMove,
			...data,
		}
	}

	constructor() {
		makeAutoObservable(this)
	}
}
