import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */

// type ActiveTabSection = 'project' | 'rundown' | 'new-rundown'
export class GuiStore {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []

	private _activeProjectPageId?: string = undefined
	get activeProjectPageId() {
		return this._activeProjectPageId
	}
	set activeProjectPageId(projectPageId: string | undefined) {
		this._activeProjectPageId = projectPageId
	}

	activeTabId: 'project' | 'new-rundown' | string = 'project'

	constructor() {
		makeAutoObservable(this)
	}
}
