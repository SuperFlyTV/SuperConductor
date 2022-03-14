import { makeAutoObservable } from 'mobx'
import { Rundown } from '../../models/rundown/Rundown'
import { AppData, WindowPosition } from '../../models/App/AppData'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'

export class AppStore {
	windowPosition?: WindowPosition = undefined

	onError: any

	serverAPI = new IPCServer(ipcRenderer)
	ipcClient = new IPCClient(ipcRenderer, {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		updateAppData: (_appData) => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		updateProject: (_project) => {},
		updateRundown: (rundownId: string, rundown: Rundown) => {
			this._currentRundownId = rundownId
			this._currentRundown = rundown
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		updateResource: (_resourceId, _resource) => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		updateBridgeStatus: (_bridgeId, _status) => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		updatePeripheral: (_peripheralId, _peripheral) => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		updatePeripheralTriggers: (_peripheralTriggers) => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		openSettings: () => {},
	})

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
	private _currentRundownId?: string = undefined
	get currentRundownId() {
		return this._currentRundownId
	}

	/**
	 * Currently opened rundown data
	 */
	private _currentRundown?: Rundown = undefined
	get currentRundown() {
		return this._currentRundown
	}

	/**
	 * Method triggers rundown update with the new rundown id.
	 * @param rundownId ID of the new current rundown
	 */
	setCurrentRundown(rundownId?: string) {
		if (rundownId) {
			this.serverAPI.triggerSendRundown({ rundownId: rundownId }).catch(() => {
				//TODO
			})
		} else {
			this._currentRundownId = undefined
			this._currentRundown = undefined
		}
	}

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
