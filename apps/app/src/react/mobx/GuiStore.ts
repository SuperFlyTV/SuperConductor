import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */

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
