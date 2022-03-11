import { makeAutoObservable } from 'mobx'

export class GuiStore {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []

	constructor() {
		makeAutoObservable(this)
	}
}
