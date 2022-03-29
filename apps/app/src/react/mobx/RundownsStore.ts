/* eslint-disable @typescript-eslint/no-unused-vars */
import { makeAutoObservable } from 'mobx'
import { Rundown } from '../../models/rundown/Rundown'
import { IPCClient } from '../api/IPCClient'
import { IPCServer } from '../api/IPCServer'
import { store } from './store'
const { ipcRenderer } = window.require('electron')

interface IRundownsItems {
	[fileName: string]: {
		name: string
		open: boolean
	}
}

export class RundownsStore {
	/**
	 * List of all available rundowns
	 */
	rundowns?: IRundownsItems = undefined

	serverAPI = new IPCServer(ipcRenderer)
	ipcClient = new IPCClient(ipcRenderer, {
		updateRundown: (rundownId: string, rundown: Rundown) => {
			// TODO - REVERT THIS BACK!
			// store.guiStore.activeTabId = rundownId
			this.currentRundownId = rundownId
			this.currentRundown = rundown
		},
	})

	constructor() {
		makeAutoObservable(this)
	}

	update(rundowns: IRundownsItems | undefined) {
		this.rundowns = rundowns
	}

	/**
	 * Id of the currently opened rundown
	 */
	private _currentRundownId?: string = undefined
	get currentRundownId() {
		return this._currentRundownId
	}
	private set currentRundownId(id: string | undefined) {
		this._currentRundownId = id
	}

	/**
	 * Currently opened rundown data
	 */
	private _currentRundown?: Rundown = undefined
	get currentRundown() {
		return this._currentRundown
	}
	private set currentRundown(rd: Rundown | undefined) {
		this._currentRundown = rd
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
