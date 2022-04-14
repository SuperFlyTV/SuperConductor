/* eslint-disable @typescript-eslint/no-unused-vars */
import { makeAutoObservable, IObservableArray } from 'mobx'
import { getDefaultGroup } from '../../electron/defaults'
import { Rundown } from '../../models/rundown/Rundown'
import { Group } from '../../models/rundown/Group'
import { IPCClient } from '../api/IPCClient'
import { IPCServer } from '../api/IPCServer'
import { store } from './store'
import short from 'short-uuid'
import { allowMovingItemIntoGroup, findPartInRundown, generateNewTimelineObjIds } from '../../lib/util'
import { Part } from '../../models/rundown/Part'
import { deepClone } from '@shared/lib'
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
			this._currentRundownClean = deepClone(rundown)
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
		this._currentRundown = rd as any
		this._currentRundownClean = deepClone(rd)
	}

	/**
	 * A copy of the current rundown that can't be modified by frontend code.
	 * Used in Group and Part moves to compare our mutated state to the original state.
	 */
	private _currentRundownClean?: Readonly<Rundown> = undefined

	/**
	 * The function which commits a Part move, sending an IPC API command to the electron backend.
	 */
	private _commitMovePartFn: CommitFunction | undefined = undefined

	/**
	 * The function which commits a Group move, sending an IPC API command to the electron backend.
	 */
	private _commitMoveGroupFn: CommitFunction | undefined = undefined

	/**
	 * Used in Group moves to avoid making multiple duplicates of the Group when duplicate is enabled.
	 * Contains the ID of the duplicate.
	 * Gets set back to "false" when the move is committed.
	 */
	private _madeGroupDuplicate: string | false = false

	/**
	 * Used in Part moves to avoid making multiple duplicate of the Part when duplicate is enabled.
	 * Contains the ID of the duplicate.
	 * Gets set back to "false" when the move is committed.
	 */
	private _madePartDuplicate: string | false = false
	get madePartDuplicate() {
		return this._madePartDuplicate
	}

	/**
	 * Used in Group and Part moves.
	 */
	private _duplicate = false
	get duplicate() {
		return this._duplicate
	}
	set duplicate(newValue: boolean) {
		this._duplicate = newValue
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
			this._currentRundownClean = undefined
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
		const currentRundown = this._currentRundown as any as IObservableObject<Rundown>

		if (currentRundown === undefined) {
			return
		}

		const currentRundownClean = this._currentRundownClean as any as Readonly<IObservableObject<Rundown>>

		if (!currentRundownClean) {
			return
		}

		/** The group being moved */
		const group = currentRundown.groups.find((g) => g.id === groupId)

		if (!group) {
			return
		}

		if (this._duplicate && !this._madeGroupDuplicate) {
			/**
			 * The target group's position in the clean version of the rundown.
			 */
			const originalPosition = currentRundownClean.groups.findIndex((g) => g.id === groupId)

			// Make a copy of the group, give it and all its children unique IDs, and leave it at the original position.
			const copy = deepClone(group)
			copy.id = short.generate()
			this._madeGroupDuplicate = copy.id
			for (const part of copy.parts) {
				part.id = short.generate()
				part.timeline = generateNewTimelineObjIds(part.timeline)
			}
			currentRundown.groups.splice(originalPosition, 1, copy)
		}

		// Remove the group from the groups array and re-insert it at its new position
		currentRundown.groups.remove(group)
		currentRundown.groups.spliceWithArray(position, 0, [group])

		this._commitMoveGroupFn = async () => {
			const duplicate = this._duplicate
			this._madeGroupDuplicate = false
			this._duplicate = false

			if (duplicate) {
				await this.serverAPI.duplicateGroup({
					rundownId: currentRundown.id,
					groupId: groupId,
					position: position,
				})
			} else {
				await this.serverAPI.moveGroup({
					rundownId: currentRundown.id,
					groupId: groupId,
					position: position,
				})
			}
		}
	}

	commitMoveGroupInCurrentRundown() {
		if (!this._commitMoveGroupFn) {
			return
		}

		const fn = this._commitMoveGroupFn
		this._commitMoveGroupFn = undefined

		return fn().catch((error) => {
			this._revertRundown()
			throw error
		})
	}

	movePartInCurrentRundown(partId: string, toGroupId: string | null, position: number): void {
		console.log('movePart')
		const currentRundown = this._currentRundown as any as IObservableObject<Rundown>

		if (currentRundown === undefined) {
			return
		}

		const currentRundownClean = this._currentRundownClean as any as Readonly<IObservableObject<Rundown>>

		if (!currentRundownClean) {
			return
		}

		let part: Part
		let fromGroup: Group

		if (this._duplicate) {
			if (this._madePartDuplicate) {
				const result = findPartInRundown(currentRundown, this._madePartDuplicate)

				if (!result) {
					throw new Error(
						`Move Part failed: Could not find part "${this._madePartDuplicate}" in the dirty copy of rundown "${currentRundown.id}".`
					)
				}

				part = result.part
				fromGroup = result.group
			} else {
				const cleanResult = findPartInRundown(currentRundownClean, partId)

				if (!cleanResult) {
					throw new Error(
						`Move Part failed: Could not find part "${partId}" in the clean copy of rundown "${currentRundownClean.id}".`
					)
				}

				/**
				 * The target part's group in the clean version of the rundown.
				 */
				const originalGroup = cleanResult.group

				const tmp = currentRundown.groups.find((g) => g.id === originalGroup.id)

				if (!tmp) {
					throw new Error(
						`Move Part failed: Could not find group "${originalGroup.id}" in the dirty copy of rundown "${currentRundown.id}".`
					)
				}

				fromGroup = tmp

				if (fromGroup.id !== originalGroup.id) {
					throw new Error('Move Part failed: Group ID discrepancy during duplication.')
				}

				// If the fromGroup is transparent, then we can't start out by putting the copy in it,
				// because transparent groups can only contain a single part.
				// So, in this case, we start out by putting the copy into a new transparent group.
				if (fromGroup.transparent) {
					toGroupId = null
				}

				// Make a copy of the part, give it and all its children unique IDs, and set it as the part being moved.
				const copy = deepClone(cleanResult.part)
				copy.id = short.generate()
				this._madePartDuplicate = copy.id
				copy.timeline = generateNewTimelineObjIds(copy.timeline)
				part = copy
				console.log('made duplicate')
			}
		} else {
			const result = findPartInRundown(currentRundown, partId)

			if (!result) {
				throw new Error(
					`Move Part failed: Could not find part "${partId}" in the dirty copy of rundown "${currentRundown.id}".`
				)
			}

			part = result.part
			fromGroup = result.group
		}

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

		if (fromGroup.transparent && toGroupId === fromGroup.id && this._duplicate) {
			toGroup = {
				...getDefaultGroup(),

				id: short.generate(),
				name: part.name,
				transparent: true,

				parts: [part],
			}
			madeNewTransparentGroup = true
			position = currentRundown.groups.findIndex((g) => g.id === fromGroup.id)
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
			console.log(position)
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
			const duplicate = this._duplicate
			this._madePartDuplicate = false
			this._duplicate = false

			if (duplicate) {
				await this.serverAPI.duplicatePart({
					from: {
						rundownId: currentRundown.id,
						partId: partId,
					},
					to: {
						groupId: toGroupId,
						position: position,
					},
				})
			} else {
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
	}

	commitMovePartInCurrentRundown() {
		if (!this._commitMovePartFn) {
			return
		}

		const fn = this._commitMovePartFn
		this._commitMovePartFn = undefined

		return fn().catch((error) => {
			this._revertRundown()
			throw error
		})
	}

	/**
	 * Reverts _currentRundown to a fresh copy of _currentRundownClean.
	 */
	private _revertRundown() {
		this._currentRundown = deepClone(this._currentRundownClean)
	}
}
