/* eslint-disable @typescript-eslint/no-unused-vars */
import { makeAutoObservable, IObservableArray, runInAction } from 'mobx'
import { getDefaultGroup } from '../../electron/defaults'
import { Rundown, RundownGUI } from '../../models/rundown/Rundown'
import { Group, GroupGUI } from '../../models/rundown/Group'
import { IPCClient } from '../api/IPCClient'
import { IPCServer } from '../api/IPCServer'
import { store } from './store'
import {
	allowMovingItemIntoGroup,
	findPartInRundown,
	GroupWithShallowParts,
	RundownWithShallowGroups,
	shortID,
} from '../../lib/util'
import { Part, PartGUI } from '../../models/rundown/Part'
import { deepClone, literal, omit } from '@shared/lib'
import { ClientSideLogger } from '../api/logger'
import { Action, ActionLight } from '../../lib/triggers/action'
import _ from 'lodash'
import { TimelineObj } from '../../models/rundown/TimelineObj'
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

export type IObservableObject<T extends object> = {
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

	private _uiRundowns = new Map<string, RundownGUI>()
	private _uiGroups = new Map<string, GroupGUI>()
	private _uiParts = new Map<string, PartGUI>()
	private _uiTimeline = new Map<string, TimelineObj>()

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	constructor() {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateRundown: (rundownId: string, rundown: Rundown) => {
				runInAction(() => {
					this._rundownsClean.set(rundownId, rundown)
					this._updateRundown(rundownId, rundown)
				})
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

	hasRundown(rundownId: string): boolean {
		return this._uiRundowns.has(rundownId)
	}
	hasGroup(groupId: string): boolean {
		return this._uiGroups.has(groupId)
	}
	hasPart(partId: string): boolean {
		return this._uiParts.has(partId)
	}
	hasTimelineObj(objId: string): boolean {
		return this._uiTimeline.has(objId)
	}
	getRundown(rundownId: string): RundownGUI {
		const rundown = this._uiRundowns.get(rundownId)
		if (!rundown) throw new Error(`Internal Error: Rundown ${rundownId} not found in store `)
		return rundown
	}
	getGroup(groupId: string): GroupGUI {
		const group = this._uiGroups.get(groupId)
		if (!group) throw new Error(`Internal Error: Group ${groupId} not found in store `)
		return group
	}
	getPart(partId: string): PartGUI {
		const part = this._uiParts.get(partId)
		if (!part) throw new Error(`Internal Error: Part ${partId} not found in store `)
		return part
	}
	getTimelineObj(objId: string): TimelineObj {
		const obj = this._uiTimeline.get(objId)
		if (!obj) throw new Error(`Internal Error: TimelineObj ${objId} not found in store `)
		return obj
	}
	getRundownGroups(rundownId: string): GroupGUI[] {
		const rundown = this.getRundown(rundownId)
		return rundown.groupIds.map((id) => this.getGroup(id))
	}
	getRundownWithGroups(rundownId: string): RundownWithShallowGroups {
		const rundown = this.getRundown(rundownId)
		const groups = this.getRundownGroups(rundownId)
		return {
			...rundown,
			groups,
		}
	}
	getGroupParts(groupId: string): PartGUI[] {
		const group = this.getGroup(groupId)
		return group.partIds.map((id) => this.getPart(id))
	}
	getGroupWithParts(groupId: string): GroupWithShallowParts {
		const group = this.getGroup(groupId)
		const parts = this.getGroupParts(groupId)
		return {
			...group,
			parts,
		}
	}

	getPartTimeline(partId: string): TimelineObj[] {
		const part = this.getPart(partId)
		return part.timelineIds.map((id) => this.getTimelineObj(id))
	}

	/** Go through all the changes in the rundown, group and parts  */
	private _updateRundown(rundownId: string, rundown: Rundown | null): void {
		const existingRundown = this._uiRundowns.get(rundownId)
		if (!rundown) {
			this._rundowns.delete(rundownId)
			if (existingRundown) {
				// Removed Groups:
				for (const groupId of existingRundown.groupIds) {
					const existingGroup = this._uiGroups.get(groupId)
					if (existingGroup) {
						this._uiGroups.delete(groupId)
						// Removed Parts:
						for (const partId of existingGroup.partIds) {
							const existingPart = this._uiParts.get(partId)
							if (existingPart) {
								this._uiParts.delete(partId)
								// Removed Timeline objects:
								for (const objId of existingPart.timelineIds) {
									this._uiTimeline.delete(objId)
								}
							}
						}
					}
				}
			}
			return
		}
		this._rundowns.set(rundownId, rundown)

		const existingGroupIds = new Set(existingRundown?.groupIds)
		const uiRundown = literal<RundownGUI>({
			...omit(rundown, 'groups'),
			groupIds: rundown.groups.map((g) => g.id),
		})
		if (!_.isEqual(uiRundown, existingRundown)) {
			this._uiRundowns.set(rundownId, uiRundown)
		}

		const cleanup = {
			existingPartIds: new Set<string>(),
			usedPartIds: new Set<string>(),
			existingTimelineIds: new Set<string>(),
			usedTimelineIds: new Set<string>(),
		}

		// Save Groups:
		for (const group of rundown.groups) {
			existingGroupIds.delete(group.id)
			const c = this._updateGroup(group)
			c.existingPartIds.forEach((partId) => cleanup.existingPartIds.add(partId))
			c.usedPartIds.forEach((partId) => cleanup.usedPartIds.add(partId))
			c.existingTimelineIds.forEach((objId) => cleanup.existingTimelineIds.add(objId))
			c.usedTimelineIds.forEach((objId) => cleanup.usedTimelineIds.add(objId))
		}
		// Removed TimelineObjects:
		for (const objId of cleanup.existingTimelineIds.keys()) {
			if (!cleanup.usedTimelineIds.has(objId)) {
				this._uiTimeline.delete(objId)
			}
		}
		// Removed Parts:
		for (const partId of cleanup.existingPartIds.keys()) {
			if (!cleanup.usedPartIds.has(partId)) {
				this._uiParts.delete(partId)
			}
		}
		// Removed Groups:
		for (const groupId of existingGroupIds.keys()) {
			this._uiGroups.delete(groupId)
		}
	}
	private _updateGroup(group: Group) {
		const groupId = group.id
		const existingGroup = this._uiGroups.get(groupId)
		const cleanup = {
			existingPartIds: new Set(existingGroup?.partIds),
			usedPartIds: new Set<string>(),
			existingTimelineIds: new Set<string>(),
			usedTimelineIds: new Set<string>(),
		}
		const uiGroup = literal<GroupGUI>({
			...omit(group, 'parts'),
			partIds: group.parts.map((p) => p.id),
		})
		if (!_.isEqual(uiGroup, existingGroup)) {
			this._uiGroups.set(groupId, uiGroup)
		}
		// Save Parts:
		for (const part of group.parts) {
			cleanup.usedPartIds.add(part.id)
			const c = this._updatePart(part)
			c.existingTimelineIds.forEach((partId) => cleanup.existingTimelineIds.add(partId))
			c.usedTimelineIds.forEach((partId) => cleanup.usedTimelineIds.add(partId))
		}

		return cleanup
	}
	private _updatePart(part: Part) {
		const partId = part.id
		const existingPart = this._uiParts.get(partId)
		const cleanup = {
			existingTimelineIds: new Set(existingPart?.timelineIds),
			usedTimelineIds: new Set<string>(),
		}
		const uiPart = literal<PartGUI>({
			...omit(part, 'timeline'),
			timelineIds: part.timeline.map((o) => o.obj.id),
		})
		if (!_.isEqual(uiPart, existingPart)) {
			this._uiParts.set(partId, uiPart)
		}
		// Save Timeline:
		for (const obj of part.timeline) {
			const objId = obj.obj.id
			cleanup.usedTimelineIds.add(objId)
			if (!_.isEqual(obj, this._uiTimeline.get(objId))) {
				this._uiTimeline.set(objId, obj)
			}
		}
		return cleanup
	}

	getRundownRaw(rundownId: string, clone = true): Rundown | undefined {
		const rundown = this._rundowns.get(rundownId)
		return clone ? deepClone(rundown) : rundown
	}
	getGroupRaw(rundownId: string, groupId: string, clone = true): Group | undefined {
		const rundown = this.getRundownRaw(rundownId, false)
		if (!rundown) return undefined

		const group = rundown.groups.find((g) => g.id === groupId)
		return clone ? deepClone(group) : group
	}
	getPartRaw(rundownId: string, groupId: string, partId: string, clone = true): Part | undefined {
		const group = this.getGroupRaw(rundownId, groupId, false)
		if (!group) return undefined

		const part = group.parts.find((p) => p.id === partId)
		return clone ? deepClone(part) : part
	}

	// updateRundown(rundownId: string, updateRundown: Rundown): void {
	// 	const rundown = this._getRundown(rundownId)
	// 	if (rundown === updateRundown)
	// 		throw new Error(
	// 			`updateRundown: updateRundown is identical to stored object. You should provide a clone instead.`
	// 		)
	// 	assign(rundown, updateRundown)
	// }
	// updateRundownPartial(rundownId: string, updateRundown: Partial<Rundown>): void {
	// 	const rundown = this._getRundown(rundownId)
	// 	if (rundown === updateRundown)
	// 		throw new Error(
	// 			`updateRundown: updateRundown is identical to stored object. You should provide a clone instead.`
	// 		)
	// 	assignPartial(rundown, updateRundown)
	// }
	// updateGroup(rundownId: string, groupId: string, updateGroup: Group): void {
	// 	const group = this._getGroup(rundownId, groupId)
	// 	if (group === updateGroup)
	// 		throw new Error(
	// 			`updateGroup: updateGroup is identical to stored object. You should provide a clone instead.`
	// 		)
	// 	assign(group, updateGroup)
	// }
	// updateGroupPartial(rundownId: string, groupId: string, updateGroup: Partial<Group>): void {
	// 	const group = this._getGroup(rundownId, groupId)
	// 	if (group === updateGroup)
	// 		throw new Error(
	// 			`updateGroup: updateGroup is identical to stored object. You should provide a clone instead.`
	// 		)
	// 	assignPartial(group, updateGroup)
	// }
	// updatePart(rundownId: string, groupId: string, partId: string, updatePart: Part): void {
	// 	const part = this._getPart(rundownId, groupId, partId)
	// 	if (part === updatePart)
	// 		throw new Error(`updatePart: updatePart is identical to stored object. You should provide a clone instead.`)
	// 	assign(part, updatePart)
	// }
	// updatePartPartial(rundownId: string, groupId: string, partId: string, updatePart: Partial<Part>): void {
	// 	const part = this._getPart(rundownId, groupId, partId)
	// 	if (part === updatePart)
	// 		throw new Error(`updatePart: updatePart is identical to stored object. You should provide a clone instead.`)
	// 	assignPartial(part, updatePart)
	// }
	// private _getRundown(rundownId: string): Rundown {
	// 	const rundown = this._rundowns.get(rundownId)
	// 	if (!rundown) throw new Error(`rundown ${rundownId} not found`)
	// 	return rundown
	// }
	// private _getGroup(rundownId: string, groupId: string): Group {
	// 	const rundown = this._getRundown(rundownId)
	// 	const group = rundown.groups.find((g) => g.id === groupId)
	// 	if (!group) throw new Error(`group ${groupId} not found`)
	// 	return group
	// }
	// private _getPart(rundownId: string, groupId: string, partId: string): Part {
	// 	const group = this._getGroup(rundownId, groupId)
	// 	const part = group.parts.find((p) => p.id === partId)
	// 	if (!part) throw new Error(`part ${partId} not found`)
	// 	return part
	// }

	/**
	 * Id of the currently opened rundown
	 */
	get currentRundownId() {
		return this._currentRundownId
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

	getGroupInCurrentRundown(groupId: string): Group | undefined {
		if (!this._currentRundownId) return undefined
		const currentRundown = this._rundowns.get(this._currentRundownId)
		if (!currentRundown) return undefined
		return currentRundown.groups.find((group) => group.id === groupId)
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
		const currentRundownId = this.currentRundownId
		if (currentRundownId === undefined) return

		let currentRundown = this.getRundownRaw(currentRundownId, false)
		if (!currentRundown) return

		/** The group being moved */
		const group = currentRundown.groups.find((g) => g.id === groupId)
		if (!group) return

		// Make a shallow copy, so it can be edited and saved:
		currentRundown = {
			...currentRundown,
			groups: [...currentRundown.groups],
		}
		// Remove the group from the groups array and re-insert it at its new position
		currentRundown.groups = currentRundown.groups.filter((g) => g === group)
		currentRundown.groups.splice(position, 0, group)

		// Temporary update while moving:
		this._updateRundown(currentRundownId, currentRundown)

		this._commitMoveGroupFn = async () => {
			await this.serverAPI.moveGroup({
				rundownId: currentRundownId,
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
		const currentRundownId = this.currentRundownId
		if (currentRundownId === undefined) return

		const currentRundown = this.getRundownRaw(currentRundownId)
		if (!currentRundown) return

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

		if (!toGroup) return

		const allow = allowMovingItemIntoGroup(part.id, fromGroup, toGroup)
		if (!allow) return

		if (!isTransparentGroupMove) {
			// Remove the part from its original group.

			fromGroup.parts = fromGroup.parts.filter((p) => p !== part)
		}

		if (madeNewTransparentGroup) {
			// Add the new transparent group to the rundown.

			// currentRundown.groups.spliceWithArray(position, 0, [toGroup])
			currentRundown.groups = [...currentRundown.groups]
			currentRundown.groups.splice(position, 0, toGroup)
		} else if (isTransparentGroupMove) {
			// Move the transparent group to its new position.

			// currentRundown.groups.remove(toGroup)
			// currentRundown.groups.spliceWithArray(position, 0, [toGroup])
			const toGroupId = toGroup.id
			currentRundown.groups = currentRundown.groups.filter((g) => g.id !== toGroupId)
			currentRundown.groups.splice(position, 0, toGroup)
		} else if (!isTransparentGroupMove) {
			// Add the part to its new group, in its new position.

			// ;(toGroup as any as IObservableObject<Group>).parts.spliceWithArray(position, 0, [part])
			currentRundown.groups = [...currentRundown.groups]
			const toGroupId = toGroup.id
			const group = currentRundown.groups.find((g) => g.id === toGroupId)
			if (!group) throw new Error('movePartInCurrentRundown: Could not find group')

			group.parts = [...group.parts]

			group.parts.splice(position, 0, part)
		}

		// Clean up leftover empty transparent groups.
		if (fromGroup.transparent && fromGroup.parts.length <= 0) {
			currentRundown.groups = currentRundown.groups.filter((g) => g.id !== fromGroup.id)
			// const groupToRemove = currentRundown.groups.findIndex((g) => g.id === fromGroup.id)
			// if (groupToRemove) {
			// 	currentRundown.groups.remove(groupToRemove)
			// }
		}

		// Temporary update while moving:
		this._updateRundown(currentRundownId, currentRundown)

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
		this._updateRundown(rundownId, this._rundownsClean.get(rundownId) ?? null)
	}

	private _allButtonActions: Map<string, Action[]> = new Map()
	get allButtonActions() {
		return this._allButtonActions as Readonly<typeof this._allButtonActions>
	}
	set allButtonActions(newValue: Map<string, Action[]>) {
		this._allButtonActions = newValue
	}

	getActionsForPart(partId: string): ActionLight[] {
		const result = []
		for (const [_id, actions] of this._allButtonActions) {
			for (const action of actions) {
				if (action.part.id === partId) {
					result.push(
						_.omit(
							action,

							'group' // omit the group here, to avoid subscribers being reactive to any change in the whole group
						)
					)
				}
			}
		}
		return result
	}
}
