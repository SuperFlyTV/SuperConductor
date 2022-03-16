import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */

type ActiveTabSection = 'project' | 'rundown' | 'new-rundown'
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

	private _currentlyActiveTabSection: ActiveTabSection = 'rundown'
	get currentlyActiveTabSection() {
		return this._currentlyActiveTabSection
	}
	set currentlyActiveTabSection(sectionId: ActiveTabSection) {
		this._currentlyActiveTabSection = sectionId
	}

	constructor() {
		makeAutoObservable(this)
	}
}
