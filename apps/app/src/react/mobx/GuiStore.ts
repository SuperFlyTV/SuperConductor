import { makeAutoObservable } from 'mobx'
import { DefiningArea } from '../../lib/triggers/keyDisplay'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')

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

export type HomePageId = 'project' | 'bridgesSettings' | 'mappingsSettings'
export class GuiStore {
	serverAPI = new IPCServer(ipcRenderer)

	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[] = []

	definingArea: DefiningArea | null = null

	private _activeTabId = 'home'
	get activeTabId() {
		return this._activeTabId
	}
	set activeTabId(id: string) {
		this._activeTabId = id
	}

	activeHomePageId = 'project'

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

	updateDefiningArea(definingArea: DefiningArea | null) {
		this.definingArea = definingArea
	}

	async getSelectedAndPlayingTimelineObjIds(rundownId: string): Promise<Set<string>> {
		const playingIds = new Set<string>()
		const promises: Array<Promise<void>> = []
		for (const timelineObjId of this.selectedTimelineObjIds) {
			const promise = this.serverAPI
				.isTimelineObjPlaying({
					rundownId,
					timelineObjId,
				})
				.then((isPlaying) => {
					if (isPlaying) playingIds.add(timelineObjId)
				})
			promises.push(promise)
		}

		await Promise.all(promises)

		return playingIds
	}

	constructor() {
		makeAutoObservable(this)
	}
}
