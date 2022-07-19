import { deepClone } from '@shared/lib'
import _ from 'lodash'
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
	// pointerX?: number
	/** The current client Y position of the pointer [pixels] */
	// pointerY?: number
	/** The origin client X position of the pointer when the move began [pixels] */
	originX?: number
	/** The origin client Y position of the pointer when the move began [pixels] */
	originY?: number
	/** Whether to make a duplicate of the moved timelineObj or not */
	duplicate?: boolean
	/** A unique identifier for each move transaction */
	moveId: null | string
	/** Set to true when a move has completed and is being saved */
	saving?: boolean
}
export type CurrentSelectionAny = CurrentSelectionGroup | CurrentSelectionPart | CurrentSelectionTimelineObj
export interface CurrentSelectionBase {
	type: 'group' | 'part' | 'timelineObj'
}
export interface CurrentSelectionGroup extends CurrentSelectionBase {
	type: 'group'
	groupId: string
}
export interface CurrentSelectionPart extends CurrentSelectionBase {
	type: 'part'
	groupId: string
	partId: string
}
export interface CurrentSelectionTimelineObj extends CurrentSelectionBase {
	type: 'timelineObj'
	groupId: string
	partId: string
	timelineObjId: string
}

export type HomePageId = 'project' | 'bridgesSettings' | 'mappingsSettings'
interface ResourceLibrarySettings {
	/** A list of the selected resources, sorted in the order they where selected */
	selectedResourceIds: string[]
	/** A reference to the latest selected Resource */
	lastSelectedResourceId: string | null
	nameFilterValue: string
	deviceFilterValue: string[]
}
export class GuiStore {
	serverAPI = new IPCServer(ipcRenderer)

	private _selected: CurrentSelectionAny[] = []

	private _resourceLibrary: ResourceLibrarySettings = {
		selectedResourceIds: [],
		lastSelectedResourceId: null,
		nameFilterValue: '',
		deviceFilterValue: [],
	}

	definingArea: DefiningArea | null = null

	private groupSettings = new Map<string, GroupSettings>()

	private _activeTabId = 'home'
	get activeTabId() {
		return this._activeTabId
	}
	set activeTabId(id: string) {
		this._activeTabId = id
	}

	/** A list of all selected items */
	get selected(): Readonly<CurrentSelectionAny[]> {
		return this._selected
	}
	/** The main selected item */
	get mainSelected(): Readonly<CurrentSelectionAny> | undefined {
		if (this._selected.length === 0) return undefined
		return this._selected[this._selected.length - 1]
	}
	getSelectedOfType(type: 'group'): CurrentSelectionGroup[]
	getSelectedOfType(type: 'part'): CurrentSelectionPart[]
	getSelectedOfType(type: 'timelineObj'): CurrentSelectionTimelineObj[]
	getSelectedOfType(type: string) {
		return this._selected.filter((s) => s.type === type)
	}
	/** Add item to selection */
	isSelected(selected: CurrentSelectionAny): boolean {
		return !!this._selected.find((s) => _.isEqual(s, selected))
	}
	/** Set the selection to this item */
	setSelected(selected: CurrentSelectionAny): void {
		if (this._selected.length !== 1 || !this.isSelected(selected)) {
			this.clearSelected()
			this._selected.push(selected)
		}
	}
	/** Set this item to the selection, or if it already is set, clear the selection */
	toggleSelected(selected: CurrentSelectionAny): void {
		if (this.selected.length === 1 && this.isSelected(selected)) {
			this.clearSelected()
		} else {
			this.setSelected(selected)
		}
	}
	/** Add item to selection */
	addSelected(selected: CurrentSelectionAny): void {
		if (this.isSelected(selected)) {
			if (this._selected.length > 1) {
				// Remove and re-add, so that the newly added item is the main selected:
				this.removeSelected(selected)
				this._selected.push(selected)
			} else {
				// Nothing to do
			}
		} else {
			this._selected.push(selected)
		}
	}
	/** Add this item to the selection, or if it already is in there, remove it */
	toggleAddSelected(selected: CurrentSelectionAny): void {
		if (this.isSelected(selected)) {
			this.removeSelected(selected)
		} else {
			this.addSelected(selected)
		}
	}
	/** Add item from selection */
	removeSelected(selected: CurrentSelectionAny): void {
		const index = this._selected.findIndex((s) => _.isEqual(s, selected))
		if (index >= 0) {
			this._selected.splice(index, 1)
		}
	}
	/** Clear all items from selection */
	clearSelected(): void {
		if (this._selected.length > 0) {
			this._selected.splice(0, 9999)
		}
	}

	updateSelection(isSelectionValid: (selected: CurrentSelectionAny) => boolean): void {
		const selectionsToRemove: CurrentSelectionAny[] = []
		for (const selected of this._selected) {
			if (!isSelectionValid(selected)) {
				selectionsToRemove.push(selected)
			}
		}
		for (const selected of selectionsToRemove) {
			this.removeSelected(selected)
		}
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

	getGroupSettings(groupId: string): GroupSettings {
		return this.groupSettings.get(groupId) || {}
	}
	setGroupSettings(groupId: string, update: Partial<GroupSettings>): void {
		const org = this.getGroupSettings(groupId)
		const updated: GroupSettings = {
			...org,
			...update,
		}
		if (!_.isEqual(updated, org)) {
			this.groupSettings.set(groupId, updated)
		}
	}
	get resourceLibrary(): Readonly<ResourceLibrarySettings> {
		return deepClone(this._resourceLibrary)
	}
	updateResourceLibrary(update: Partial<ResourceLibrarySettings>) {
		this._resourceLibrary = {
			...this._resourceLibrary,
			...update,
		}
	}

	constructor() {
		makeAutoObservable(this)
	}
}

interface GroupSettings {
	/** Whether or not this Group should be visually collapsed in the app view. Does not affect playout. */
	collapsed?: boolean
}
