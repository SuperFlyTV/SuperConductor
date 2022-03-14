import { makeAutoObservable } from 'mobx'
import { AppData, WindowPosition } from '../../models/App/AppData'

export class AppStore {
	windowPosition?: WindowPosition = undefined

	// TODO: Refactor this?
	project?: {
		id: string
	} = undefined

	/**
	 * List of all available rundowns
	 */
	rundowns?: {
		[fileName: string]: {
			name: string
			open: boolean
		}
	} = undefined

	/**
	 * Id of the currently opened rundown
	 */
	currentRundownId?: string = undefined

	constructor(init?: AppData) {
		makeAutoObservable(this)

		if (init) {
			this.update(init)
		}
	}

	update(data: AppData) {
		this.windowPosition = data.windowPosition
		this.project = data.project
		this.rundowns = data.rundowns
	}

	/**
	 * Returns all opened rundowns
	 */
	get openRundowns() {
		if (!this.rundowns) {
			return []
		}

		return Object.entries(this.rundowns)
			.filter(([_rundownId, rundown]) => {
				return rundown.open === true
			})
			.map(([rundownId, closedRundown]) => ({
				rundownId,
				name: closedRundown.name,
			}))
	}

	/**
	 * Returns all closed rundowns
	 */
	get closedRundowns() {
		if (!this.rundowns) {
			return []
		}

		return Object.entries(this.rundowns)
			.filter(([_rundownId, rundown]) => {
				return rundown.open === false
			})
			.map(([rundownId, closedRundown]) => ({
				rundownId,
				name: closedRundown.name,
			}))
	}
}
