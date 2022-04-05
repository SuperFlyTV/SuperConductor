/* eslint-disable @typescript-eslint/no-unused-vars */
import { makeAutoObservable, IObservableArray } from 'mobx'
import { getDefaultGroup } from '../../electron/defaults'
import { Rundown } from '../../models/rundown/Rundown'
import { Group } from '../../models/rundown/Group'
import { IPCClient } from '../api/IPCClient'
import { IPCServer } from '../api/IPCServer'
import { store } from './store'
import short from 'short-uuid'
import { allowMovingItemIntoGroup, findPartInRundown } from '../../lib/util'
import { Part } from '../../models/rundown/Part'
const { ipcRenderer } = window.require('electron')

interface IRundownsItems {
	[fileName: string]: {
		name: string
		open: boolean
	}
}

type CommitFunction = () => Promise<void>

export class RundownsStore {
	/**
	 * List of all available rundowns
	 */
	rundowns?: IRundownsItems = undefined

	serverAPI = new IPCServer(ipcRenderer)
	ipcClient = new IPCClient(ipcRenderer, {
		updateRundown: (rundownId: string, rundown: Rundown) => {
			store.guiStore.activeTabId = rundownId
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
	 * The function which commits a Part move, sending an IPC API command to the electron backend.
	 */
	private _commitMovePartFn: CommitFunction | undefined = undefined

	/**
	 * The function which commits a Group move, sending an IPC API command to the electron backend.
	 */
	private _commitMoveGroupFn: CommitFunction | undefined = undefined

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

	moveGroupInCurrentRundown(groupId: string, position: number): void {
		const currentRundown = this._currentRundown

		if (currentRundown === undefined) {
			return
		}

		/** The group being moved */
		const group = currentRundown.groups.find((g) => g.id === groupId)

		if (!group) {
			return
		}

		// Remove the group from the groups array and re-insert it at its new position
		currentRundown.groups = currentRundown.groups.filter((g) => g.id !== groupId)
		currentRundown.groups.splice(position, 0, group)

		this._commitMoveGroupFn = async () => {
			await this.serverAPI.moveGroup({
				rundownId: currentRundown.id,
				groupId: groupId,
				position: position,
			})
		}
	}

	commitMoveGroupInCurrentRundown() {
		if (!this._commitMoveGroupFn) {
			return
		}

		return this._commitMoveGroupFn()
	}

	movePartInCurrentRundown(partId: string, toGroupId: string | null, position: number): void {
		const currentRundown = this._currentRundown

		if (currentRundown === undefined) {
			return
		}

		const result = findPartInRundown(currentRundown, partId)

		if (!result) {
			return
		}

		const { part, group: fromGroup } = result
		let toGroup: Group | undefined
		let madeNewTransparentGroup = false
		const isTransparentGroupMove = fromGroup.transparent && toGroupId === null

		if (toGroupId) {
			toGroup = currentRundown.groups.find((g) => g.id === toGroupId)
		} else {
			if (isTransparentGroupMove) {
				toGroup = fromGroup
			} else {
				toGroup = {
					...getDefaultGroup(),

					id: short.generate(),
					name: part.name,
					transparent: true,

					parts: [part],
				}
				madeNewTransparentGroup = true
			}
		}

		if (!toGroup) {
			return
		}

		const allow = allowMovingItemIntoGroup(part.id, fromGroup, toGroup)

		if (!allow) {
			return
		}

		if (!isTransparentGroupMove) {
			// Remove the part from its original group.
			const partsArr = fromGroup.parts as IObservableArray<Part>
			partsArr.remove(part)
		}

		if (madeNewTransparentGroup) {
			// Add the new transparent group to the rundown.
			currentRundown.groups.splice(position, 0, toGroup)
		} else if (isTransparentGroupMove) {
			// Move the transparent group to its new position.
			const index = currentRundown.groups.findIndex((g) => toGroup && g.id === toGroup.id)
			if (index >= 0) currentRundown.groups.splice(index, 1)
			currentRundown.groups.splice(position, 0, toGroup)
		} else if (!isTransparentGroupMove) {
			// Add the part to its new group, in its new position.
			toGroup.parts.splice(position, 0, part)
		}

		// Clean up leftover empty transparent groups.
		if (fromGroup.transparent && fromGroup.parts.length <= 0) {
			const index = currentRundown.groups.findIndex((g) => g.id === fromGroup.id)
			if (index >= 0) currentRundown.groups.splice(index, 1)
		}

		this._commitMovePartFn = async () => {
			await this.serverAPI.movePart({
				from: {
					rundownId: currentRundown.id,
					partId: partId,
				},
				to: {
					rundownId: currentRundown.id,
					groupId: toGroupId,
					position: position,
				},
			})
		}
	}

	commitMovePartInCurrentRundown() {
		if (!this._commitMovePartFn) {
			return
		}

		return this._commitMovePartFn()
	}
}
