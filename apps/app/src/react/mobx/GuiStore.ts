import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */
export class GuiStore {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []

	constructor() {
		makeAutoObservable(this)
	}
}
