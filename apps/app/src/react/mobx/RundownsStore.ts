/* eslint-disable @typescript-eslint/no-unused-vars */
import { makeAutoObservable, IObservableArray } from 'mobx'
import { getDefaultGroup } from '../../electron/defaults'
import { Rundown } from '../../models/rundown/Rundown'
import { Group } from '../../models/rundown/Group'
import { IPCClient } from '../api/IPCClient'
import { IPCServer } from '../api/IPCServer'
import { store } from './store'
import { allowMovingItemIntoGroup, findPartInRundown, generateNewTimelineObjIds, shortID } from '../../lib/util'
import { Part } from '../../models/rundown/Part'
import { deepClone } from '@shared/lib'
import { ClientSideLogger } from '../api/logger'
import { Action } from '../../lib/triggers/action'
const { ipcRenderer } = window.require('electron')

interface IRundownsItems {
	[fileName: string]: {
		name: string
		open: boolean
	}
}

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
	? ElementType
	: never

type CommitFunction = () => Promise<void>

type IObservableObject<T extends object> = {
	[k in keyof T]: T[k] extends Array<any> ? IObservableArray<ArrayElement<T[k]>> : T[k]
}

export class RundownsStore {
	private _currentRundownId?: string = undefined
	/** Set to true before first update comes in */
	private initializing = true
	private _rundowns = new Map<string, Rundown>()
	/**
	 * Keeps copies of the rundowns that can't be modified by frontend code.
	 * Used in Group and Part moves to compare our mutated state to the original state.
	 */
	private _rundownsClean = new Map<string, Readonly<Rundown>>()
	/**
	 * List of all available rundowns
	 */
	rundowns?: IRundownsItems = undefined

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	constructor() {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateRundown: (rundownId: string, rundown: Rundown) => {
				this._rundowns.set(rundownId, rundown)
				this._rundownsClean.set(rundownId, deepClone(rundown))
			},
		})
		makeAutoObservable(this)
	}

	update(rundowns: IRundownsItems | undefined) {
		this.rundowns = rundowns

		if (this.initializing) {
			this.initializing = false

			// Set the first rundown as the current one:
			const firstRundown = this.openRundowns[0] as
				| {
						rundownId: string
						name: string
				  }
				| undefined

			if (firstRundown) this.setCurrentRundown(firstRundown.rundownId)
		}
	}

	/**
	 * Id of the currently opened rundown
	 */
	get currentRundownId() {
		return this._currentRundownId
	}

	/**
	 * Currently opened rundown data
	 */
	get currentRundown(): Rundown | undefined {
		if (!this._currentRundownId) return undefined
		return this._rundowns.get(this._currentRundownId)
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
			this._currentRundownId = rundownId
			store.guiStore.activeTabId = rundownId
			this.serverAPI.triggerSendRundown({ rundownId }).catch(() => {
				//TODO
			})
		} else {
			this._currentRundownId = undefined
		}
	}

	getRundown(rundownId: string): Rundown | undefined {
		return this._rundowns.get(rundownId)
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
		const currentRundown = this.currentRundown as any as IObservableObject<Rundown>

		if (currentRundown === undefined) {
			return
		}

		/** The group being moved */
		const group = currentRundown.groups.find((g) => g.id === groupId)

		if (!group) {
			return
		}

		// Remove the group from the groups array and re-insert it at its new position
		currentRundown.groups.remove(group)
		currentRundown.groups.spliceWithArray(position, 0, [group])

		this._commitMoveGroupFn = async () => {
			await this.serverAPI.moveGroup({
				rundownId: currentRundown.id,
				groupId: groupId,
				position: position,
			})
		}
	}

	commitMoveGroupInCurrentRundown() {
		if (!this._commitMoveGroupFn) return
		if (!this.currentRundownId) return
		const currentRundownId = this.currentRundownId

		const fn = this._commitMoveGroupFn
		this._commitMoveGroupFn = undefined

		return fn().catch((error) => {
			this._revertRundown(currentRundownId)
			throw error
		})
	}

	movePartInCurrentRundown(partId: string, toGroupId: string | null, position: number): void {
		const currentRundown = this.currentRundown as any as IObservableObject<Rundown>

		if (currentRundown === undefined) {
			return
		}

		const result = findPartInRundown(currentRundown, partId)

		if (!result) {
			throw new Error(
				`Move Part failed: Could not find part "${partId}" in the dirty copy of rundown "${currentRundown.id}".`
			)
		}

		const part = result.part
		const fromGroup = result.group
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

					id: shortID(),
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
			currentRundown.groups.spliceWithArray(position, 0, [toGroup])
		} else if (isTransparentGroupMove) {
			// Move the transparent group to its new position.
			currentRundown.groups.remove(toGroup)
			currentRundown.groups.spliceWithArray(position, 0, [toGroup])
		} else if (!isTransparentGroupMove) {
			// Add the part to its new group, in its new position.
			;(toGroup as any as IObservableObject<Group>).parts.spliceWithArray(position, 0, [part])
		}

		// Clean up leftover empty transparent groups.
		if (fromGroup.transparent && fromGroup.parts.length <= 0) {
			const item = currentRundown.groups.find((g) => g.id === fromGroup.id)
			if (item) currentRundown.groups.remove(item)
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
		if (!this._commitMovePartFn) return
		if (!this.currentRundownId) return
		const currentRundownId = this.currentRundownId

		const fn = this._commitMovePartFn
		this._commitMovePartFn = undefined

		return fn().catch((error) => {
			this._revertRundown(currentRundownId)
			throw error
		})
	}

	/**
	 * Reverts _currentRundown to a fresh copy of _currentRundownClean.
	 */
	private _revertRundown(rundownId: string) {
		const reverted = deepClone(this._rundownsClean.get(rundownId))
		if (reverted) this._rundowns.set(rundownId, reverted)
		else this._rundowns.delete(rundownId)
	}

	private _allButtonActions: Map<string, Action[]> = new Map()
	get allButtonActions() {
		return this._allButtonActions as Readonly<typeof this._allButtonActions>
	}
	set allButtonActions(newValue: Map<string, Action[]>) {
		this._allButtonActions = newValue
	}

	getActionsForPart(partId: string): Action[] {
		const result = []
		for (const [_id, actions] of this._allButtonActions) {
			for (const action of actions) {
				if (action.part.id === partId) {
					result.push(action)
				}
			}
		}
		return result
	}
}
