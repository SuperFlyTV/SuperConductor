import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */
export class GuiStore {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []
	activeProjectPageId?: string = undefined

	currentlyActiveTabSection: 'project' | 'rundown' | 'new-rundown' = 'rundown'

	constructor() {
		makeAutoObservable(this)
	}
}
