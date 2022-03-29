import { makeAutoObservable } from 'mobx'

/**
 * Store contains only information about user interface
 */

export type HomePageId = 'project' | 'bridgeSettings' | 'mappingsSettings'
export class GuiStore {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []

	activeTabId = 'home'
	activeHomePageId = 'bridgeSettings'

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

	constructor() {
		makeAutoObservable(this)
	}
}
