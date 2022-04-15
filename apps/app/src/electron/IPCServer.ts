import {
	allowAddingResourceToLayer,
	allowMovingItemIntoGroup,
	deleteGroup,
	deletePart,
	deleteTimelineObj,
	findGroup,
	findPart,
	findPartInRundown,
	findTimelineObj,
	findTimelineObjIndex,
	generateNewTimelineObjIds,
	getNextPartIndex,
	getPrevPartIndex,
	getResolvedTimelineTotalDuration,
	updateGroupPlayingParts,
} from '../lib/util'
import { Group } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'
import { Resolver } from 'superfly-timeline'
import { TSRTimelineObj, DeviceType, TimelineContentTypeCasparCg, Mapping } from 'timeline-state-resolver-types'
import { Action, ActionDescription, IPCServerMethods, MAX_UNDO_LEDGER_LENGTH, UndoableResult } from '../ipc/IPCAPI'
import { UpdateTimelineCache } from './timeline'
import short from 'short-uuid'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { Rundown } from '../models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import { ResourceAny } from '@shared/models'
import { deepClone } from '@shared/lib'
import { TimelineObj, TimelineObjResolvedInstance } from '../models/rundown/TimelineObj'
import { Project } from '../models/project/Project'
import EventEmitter from 'events'
import TypedEmitter from 'typed-emitter'
import { filterMapping, getMappingFromTimelineObject } from '../lib/TSRMappings'
import { getDefaultGroup } from './defaults'
import { ActiveTrigger, Trigger } from '../models/rundown/Trigger'
import { getGroupPlayData } from '../lib/playhead'
import { TSRTimelineObjFromResource } from './resources'
import winston from 'winston'

type UndoLedger = Action[]
type UndoPointer = number

type IPCServerEvents = {
	updatedUndoLedger: (undoLedger: Readonly<UndoLedger>, undoPointer: Readonly<UndoPointer>) => void
}

function isUndoable(result: unknown): result is UndoableResult {
	if (typeof result !== 'object' || result === null) {
		return false
	}

	if (typeof (result as any).undo !== 'function') {
		return false
	}

	if (typeof (result as any).description !== 'string') {
		return false
	}

	return true
}

/** This class is used server-side, to handle requests from the client */
export class IPCServer extends (EventEmitter as new () => TypedEmitter<IPCServerEvents>) implements IPCServerMethods {
	private updateTimelineCache: UpdateTimelineCache = {}
	private undoLedger: UndoLedger = []
	private undoPointer: UndoPointer = -1

	constructor(
		ipcMain: Electron.IpcMain,
		private log: winston.Logger,
		private storage: StorageHandler,
		private session: SessionHandler,
		private callbacks: {
			// updateViewRef: () => void
			updateTimeline: (cache: UpdateTimelineCache, group: Group) => GroupPreparedPlayData | null
			updatePeripherals: (group: Group) => void
			refreshResources: () => void
			setKeyboardKeys: (activeKeys: ActiveTrigger[]) => void
		}
	) {
		super()
		for (const methodName of Object.getOwnPropertyNames(IPCServer.prototype)) {
			if (methodName[0] !== '_') {
				const fcn = (this as any)[methodName].bind(this)
				if (fcn) {
					ipcMain.handle(methodName, async (event, ...args) => {
						const result = await fcn(...args)
						if (isUndoable(result)) {
							this.undoLedger.splice(this.undoPointer + 1, this.undoLedger.length)
							this.undoLedger.push({
								description: result.description,
								arguments: args,
								undo: result.undo,
								redo: fcn,
							})
							if (this.undoLedger.length > MAX_UNDO_LEDGER_LENGTH) {
								this.undoLedger.splice(0, this.undoLedger.length - MAX_UNDO_LEDGER_LENGTH)
							}
							this.undoPointer = this.undoLedger.length - 1
							this.emit('updatedUndoLedger', this.undoLedger, this.undoPointer)
							return result.result
						} else {
							return result
						}
					})
				}
			}
		}
	}
	private getProject(): Project {
		return this.storage.getProject()
	}
	private getRundown(arg: { rundownId: string }): { rundown: Rundown } {
		const rundown = this.storage.getRundown(arg.rundownId)
		if (!rundown) throw new Error(`Rundown "${arg.rundownId}" not found.`)

		return { rundown }
	}
	private getGroup(arg: { rundownId: string; groupId: string }): { rundown: Rundown; group: Group } {
		const { rundown } = this.getRundown(arg)

		return this.getGroupOfRundown(rundown, arg.groupId)
	}
	private getGroupOfRundown(rundown: Rundown, groupId: string): { rundown: Rundown; group: Group } {
		const group = findGroup(rundown, groupId)
		if (!group) throw new Error(`Group ${groupId} not found in rundown "${rundown.id}" ("${rundown.name}").`)

		return { rundown, group }
	}

	private getPart(arg: { rundownId: string; groupId: string; partId: string }): {
		rundown: Rundown
		group: Group
		part: Part
	} {
		const { rundown, group } = this.getGroup(arg)
		return this.getPartOfGroup(rundown, group, arg.partId)
	}
	private getPartOfGroup(
		rundown: Rundown,
		group: Group,
		partId: string
	): {
		rundown: Rundown
		group: Group
		part: Part
	} {
		const part = findPart(group, partId)
		if (!part) throw new Error(`Part ${partId} not found in group ${group.id} ("${group.name}").`)

		return { rundown, group, part }
	}
	async undo(): Promise<void> {
		const action = this.undoLedger[this.undoPointer]
		try {
			await action.undo()
			this.undoPointer--
		} catch (error) {
			this.log.error('Error when undoing:', error)

			// Clear
			this.undoLedger.splice(0, this.undoLedger.length)
			this.undoPointer = -1
		}
		this.emit('updatedUndoLedger', this.undoLedger, this.undoPointer)
	}
	async redo(): Promise<void> {
		const action = this.undoLedger[this.undoPointer + 1]
		try {
			const redoResult = await action.redo(...action.arguments)
			action.undo = redoResult.undo
			this.undoPointer++
		} catch (error) {
			this.log.error('Error when redoing:', error)

			// Clear
			this.undoLedger.splice(0, this.undoLedger.length)
			this.undoPointer = -1
		}
		this.emit('updatedUndoLedger', this.undoLedger, this.undoPointer)
	}
	async triggerSendAll(): Promise<void> {
		this.storage.triggerEmitAll()
		this.session.triggerEmitAll()
	}
	async triggerSendRundown(arg: { rundownId: string }): Promise<void> {
		this.storage.triggerEmitRundown(arg.rundownId)
	}
	async setKeyboardKeys(activeKeys: ActiveTrigger[]): Promise<void> {
		this.callbacks.setKeyboardKeys(activeKeys)
	}

	async acknowledgeSeenVersion(): Promise<void> {
		const appData = this.storage.getAppData()
		appData.version.seenVersion = appData.version.currentVersion
		this.storage.updateAppData(appData)
	}
	async playPart(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const now = Date.now()
		const { rundown, group, part } = this.getPart(arg)

		this._playPart(group, part, now)

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	private async playParts(rundownId: string, groupId: string, partIds: string[]): Promise<void> {
		const now = Date.now()
		const { rundown, group } = this.getGroup({
			rundownId,
			groupId,
		})
		for (const partId of partIds) {
			const { part } = this.getPartOfGroup(rundown, group, partId)

			this._playPart(group, part, now)
		}

		this._updateTimeline(group)

		this.storage.updateRundown(rundownId, rundown)
	}
	private _playPart(group: Group, part: Part, now: number): void {
		if (part.disabled) {
			return
		}

		if (group.oneAtATime) {
			// Anything already playing should be stopped:
			group.playout.playingParts = {}
		}
		if (!group.playout.playingParts) group.playout.playingParts = {}
		// Start playing this Part:
		group.playout.playingParts[part.id] = {
			startTime: now,
			pauseTime: undefined,
		}
	}
	async pausePart(arg: { rundownId: string; groupId: string; partId: string; time?: number }): Promise<void> {
		const now = Date.now()
		const { rundown, group, part } = this.getPart(arg)
		updateGroupPlayingParts(group)
		this._pausePart(group, part, arg.time, now)

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async pauseParts(rundownId: string, groupId: string, partIds: string[], time?: number): Promise<void> {
		const now = Date.now()
		const { rundown, group } = this.getGroup({
			rundownId,
			groupId,
		})
		updateGroupPlayingParts(group)
		for (const partId of partIds) {
			const { part } = this.getPartOfGroup(rundown, group, partId)

			this._pausePart(group, part, time, now)

			// group.preparedPlayData
		}

		this._updateTimeline(group)
		this.storage.updateRundown(rundownId, rundown)
	}
	private _pausePart(group: Group, part: Part, pauseTime: number | undefined, now: number): void {
		if (part.disabled) {
			return
		}

		if (!group.playout.playingParts) group.playout.playingParts = {}

		if (group.oneAtATime) {
			// If any other parts are playing, they should be stopped:
			for (const partId of Object.keys(group.playout.playingParts)) {
				if (partId !== part.id) {
					delete group.playout.playingParts[partId]
				}
			}
		}

		// Handle this Part:
		const playingPart = group.playout.playingParts[part.id]
		if (playingPart) {
			if (playingPart.pauseTime === undefined) {
				// The part is playing, so it should be paused:

				playingPart.pauseTime =
					pauseTime ??
					// If a specific pauseTime not specified, pause at the current time:
					now - playingPart.startTime
			} else {
				// The part is paused, so it should be resumed:

				// playingPart.startTime = now - playingPart.pauseTime
				playingPart.startTime = now - playingPart.pauseTime
				playingPart.pauseTime = undefined
			}
		} else {
			// Part is not playing, cue (pause) it at the time specified:
			group.playout.playingParts[part.id] = {
				startTime: Date.now(),
				pauseTime: pauseTime ?? 0,
			}
		}
	}
	async stopPart(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		if (group.oneAtATime) {
			// Stop the group:
			group.playout.playingParts = {}
		} else {
			// Stop the part:
			delete group.playout.playingParts[arg.partId]
		}

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async setPartTrigger(arg: {
		rundownId: string
		groupId: string
		partId: string
		trigger: Trigger | null
		triggerIndex: number | null
	}): Promise<UndoableResult<string> | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const originalTriggers = deepClone(part.triggers)

		if (arg.triggerIndex === null) {
			// Replace any existing triggers:
			part.triggers = arg.trigger ? [arg.trigger] : []
		} else {
			// Modify a trigger:
			if (!arg.trigger) {
				part.triggers.splice(arg.triggerIndex, 1)
			} else {
				const triggerToEdit = part.triggers[arg.triggerIndex]
				if (triggerToEdit) {
					part.triggers[arg.triggerIndex] = arg.trigger
				} else {
					part.triggers.push(arg.trigger)
				}
			}
		}

		this.storage.updateRundown(arg.rundownId, rundown)
		this.callbacks.updatePeripherals(group)
		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)
				part.triggers = originalTriggers
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.SetPartTrigger,
			// result: newPart.id,
		}
	}
	async togglePartLoop(arg: {
		rundownId: string
		groupId: string
		partId: string
		value: boolean
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const originalValue = part.loop

		updateGroupPlayingParts(group)
		part.loop = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group, part } = this.getPart(arg)

				updateGroupPlayingParts(group)
				part.loop = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.TogglePartLoop,
		}
	}
	async togglePartDisable(arg: {
		rundownId: string
		groupId: string
		partId: string
		value: boolean
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked) {
			return null
		}

		const originalValue = part.disabled

		updateGroupPlayingParts(group)
		part.disabled = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group, part } = this.getPart(arg)

				updateGroupPlayingParts(group)
				part.disabled = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.TogglePartDisable,
		}
	}
	async togglePartLock(arg: {
		rundownId: string
		groupId: string
		partId: string
		value: boolean
	}): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)
		const originalValue = part.locked

		part.locked = arg.value

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				part.locked = originalValue

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.TogglePartLock,
		}
	}
	async stopGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		// Stop the group:
		group.playout.playingParts = {}

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async playGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled) {
			return
		}

		if (group.oneAtATime) {
			// Play the first non-disabled part
			const part = group.parts.find((p) => !p.disabled)
			if (part) {
				this.playPart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: part.id }).catch(this.log.error)
			}
		} else {
			// Play all parts (disabled parts won't get played)
			this.playParts(
				arg.rundownId,
				arg.groupId,
				group.parts.map((part) => part.id)
			).catch(this.log.error)
		}
	}
	async pauseGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled) {
			return
		}

		updateGroupPlayingParts(group)

		if (group.oneAtATime) {
			let partId: string | undefined

			const playingPartId = Object.keys(group.playout.playingParts)[0] as string | undefined
			if (playingPartId) {
				// Cue / Pause / resume the currently playing part
				partId = playingPartId
				// Cue / Pause / resume the first non-disabled part
			} else {
				const firstPart = group.parts.find((p) => !p.disabled)
				if (firstPart) partId = firstPart.id
				else partId = undefined
			}

			if (partId) {
				this.pausePart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: partId }).catch(this.log.error)
			}
		} else {
			const playingPartIds = Object.keys(group.playout.playingParts)
			if (playingPartIds.length === 0) {
				// Cue all parts
				this.pauseParts(
					arg.rundownId,
					arg.groupId,
					group.parts.map((part) => part.id)
				).catch(this.log.error)
			} else {
				// Pause / resume all parts (disabled parts won't get played)
				this.pauseParts(arg.rundownId, arg.groupId, playingPartIds).catch(this.log.error)
			}
		}
	}
	async playNext(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled || !group.oneAtATime) {
			return
		}

		const nextPartIndex = getNextPartIndex(group)
		const nextPart = group.parts[nextPartIndex]
		if (nextPart) {
			this.playPart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: nextPart.id }).catch(this.log.error)
		}
	}
	async playPrev(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled || !group.oneAtATime) {
			return
		}

		const prevPartIndex = getPrevPartIndex(group)
		const prevPart = group.parts[prevPartIndex]
		if (prevPart) {
			this.playPart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: prevPart.id }).catch(this.log.error)
		}
	}
	async newPart(arg: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
		name: string
	}): Promise<UndoableResult<{ partId: string; groupId?: string }> | null> {
		const newPart: Part = {
			id: short.generate(),
			name: arg.name,
			timeline: [],
			resolved: {
				duration: 0,
			},
			triggers: [],
		}

		const { rundown } = this.getRundown(arg)

		let transparentGroupId: string | undefined
		if (arg.groupId) {
			// Put part into existing group:
			const { group } = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })

			if (group.locked) {
				return null
			}

			group.parts.push(newPart)
		} else {
			// Create a new "transparent group":
			const newGroup: Group = {
				...getDefaultGroup(),
				id: short.generate(),
				name: arg.name,
				transparent: true,
				parts: [newPart],
			}
			transparentGroupId = newGroup.id
			rundown.groups.push(newGroup)
		}
		this.storage.updateRundown(arg.rundownId, rundown)

		const result: { partId: string; groupId?: string } = {
			partId: newPart.id,
		}

		if (transparentGroupId) {
			result.groupId = transparentGroupId
		}

		return {
			undo: () => {
				const { rundown } = this.getRundown(arg)
				if (transparentGroupId) {
					// Remove the entire group.
					rundown.groups = rundown.groups.filter((g) => g.id !== transparentGroupId)
				} else if (arg.groupId) {
					// Remove the part from its group.
					const { group } = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })
					group.parts = group.parts.filter((p) => p.id !== newPart.id)
				}
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.NewPart,
			result,
		}
	}
	async updatePart(arg: {
		rundownId: string
		groupId: string
		partId: string
		part: Part
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const partPreChange = deepClone(part)
		Object.assign(part, arg.part)

		this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				Object.assign(part, partPreChange)

				this._updatePart(part)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.UpdatePart,
		}
	}
	async newGroup(arg: { rundownId: string; name: string }): Promise<UndoableResult<string>> {
		const newGroup: Group = {
			...getDefaultGroup(),
			id: short.generate(),
			name: arg.name,
		}
		const { rundown } = this.getRundown(arg)

		rundown.groups.push(newGroup)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown } = this.getRundown(arg)
				rundown.groups = rundown.groups.filter((g) => g.id !== newGroup.id)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.NewGroup,
			result: newGroup.id,
		}
	}
	async updateGroup(arg: { rundownId: string; groupId: string; group: Group }): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return null
		}

		const groupPreChange = deepClone(group)
		Object.assign(group, arg.group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				// @TODO: Don't overwrite playout-related properties?
				Object.assign(group, groupPreChange)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.UpdateGroup,
		}
	}
	async deletePart(arg: { rundownId: string; groupId: string; partId: string }): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const deletedPartIndex = group.parts.findIndex((p) => p.id === arg.partId)
		const deletedPart = deletePart(group, arg.partId)

		let deletedTransparentGroupIndex = -1
		let deletedTransparentGroup: Group | undefined
		if (group.transparent && group.parts.length === 0) {
			deletedTransparentGroupIndex = rundown.groups.findIndex((g) => g.id === arg.groupId)
			deletedTransparentGroup = deleteGroup(rundown, group.id)
		}

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				if (!deletedPart) {
					return
				}

				const { rundown } = this.getRundown(arg)

				if (deletedTransparentGroup) {
					deletedTransparentGroup.parts.push(deletedPart)
					rundown.groups.splice(deletedTransparentGroupIndex, 0, deletedTransparentGroup)
				} else {
					const { group } = this.getGroup(arg)
					group.parts.splice(deletedPartIndex, 0, deletedPart)
				}

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.DeletePart,
		}
	}
	async deleteGroup(arg: { rundownId: string; groupId: string }): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return null
		}

		// Stop the group (so that the updates are sent to TSR):
		group.playout = {
			playingParts: {},
		}

		this._updateTimeline(group)
		const deletedGroupIndex = rundown.groups.findIndex((g) => g.id === group.id)
		const deletedGroup = deleteGroup(rundown, group.id)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				if (!deletedGroup) {
					return
				}

				const { rundown } = this.getRundown(arg)
				rundown.groups.splice(deletedGroupIndex, 0, deletedGroup)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.DeleteGroup,
		}
	}
	async movePart(arg: {
		from: { rundownId: string; partId: string }
		to: { rundownId: string; groupId: string | null; position: number }
	}): Promise<UndoableResult<Group>> {
		const { rundown: fromRundown } = this.getRundown(arg.from)
		const findPartResult = findPartInRundown(fromRundown, arg.from.partId)

		if (!findPartResult) {
			throw new Error(`Part "${arg.from.partId}" does not exist in rundown "${arg.from.rundownId}"`)
		}

		const fromGroup = findPartResult.group
		const part = findPartResult.part

		let toRundown: Rundown
		let toGroup: Group
		let madeNewTransparentGroup = false
		const isTransparentGroupMove =
			arg.from.rundownId === arg.to.rundownId && fromGroup.transparent && arg.to.groupId === null

		if (arg.to.groupId) {
			const getGroupResult = this.getGroup({ rundownId: arg.to.rundownId, groupId: arg.to.groupId })
			toRundown = arg.to.rundownId === arg.from.rundownId ? fromRundown : getGroupResult.rundown
			toGroup = getGroupResult.group
		} else {
			toRundown = arg.to.rundownId === arg.from.rundownId ? fromRundown : this.getRundown(arg.to).rundown
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

		if (!madeNewTransparentGroup && toGroup !== fromGroup && toGroup.transparent) {
			throw new Error('Cannot move a Part into an already-existing Transparent Group.')
		}

		const allow = allowMovingItemIntoGroup(arg.from.partId, fromGroup, toGroup)

		if (!allow) {
			throw new Error('Move prohibited')
		}

		const fromPlayhead = allow.fromPlayhead
		const toPlayhead = allow.toPlayhead
		const movedPartIsPlaying = fromPlayhead.playheads[arg.from.partId]

		// Save the original position for use in undo.
		const originalPosition = fromGroup.transparent
			? fromRundown.groups.findIndex((g) => g.id === fromGroup.id)
			: fromGroup.parts.findIndex((p) => p.id === arg.from.partId)

		if (!isTransparentGroupMove) {
			// Remove the part from its original group.
			fromGroup.parts = fromGroup.parts.filter((p) => p.id !== arg.from.partId)
		}

		if (madeNewTransparentGroup) {
			// Add the new transparent group to the rundown.
			toRundown.groups.splice(arg.to.position, 0, toGroup)
		} else if (isTransparentGroupMove) {
			// Move the transparent group to its new position.
			fromRundown.groups = fromRundown.groups.filter((g) => g.id !== toGroup.id)
			toRundown.groups.splice(arg.to.position, 0, toGroup)
		} else if (!isTransparentGroupMove) {
			// Add the part to its new group, in its new position.
			toGroup.parts.splice(arg.to.position, 0, part)
		}

		// Clean up leftover empty transparent groups.
		if (fromGroup.transparent && fromGroup.parts.length <= 0) {
			fromRundown.groups = fromRundown.groups.filter((group) => group.id !== fromGroup.id)
		}

		// Update timelines.
		if (!isTransparentGroupMove) {
			if (fromGroup.id === toGroup.id) {
				// Intra-group move.

				updateGroupPlayingParts(toGroup)
				if (movedPartIsPlaying && toGroup.oneAtATime) {
					// Update the group's playhead, so that the currently playing
					// part continues to play as if nothing happened:
					toGroup.playout.playingParts = {
						[arg.from.partId]: {
							startTime: movedPartIsPlaying.partStartTime,
							pauseTime: movedPartIsPlaying.partPauseTime,
						},
					}
				}
				this._updateTimeline(fromGroup)
			} else {
				// Inter-group move.
				if (movedPartIsPlaying && !toPlayhead.groupIsPlaying) {
					// Update the playhead, so that the currently playing
					// part continues to play as if nothing happened.
					// This means that the target Group will start playing
					// while the source Group stops.

					// Move over the playout-data:
					toGroup.playout.playingParts = fromGroup.playout.playingParts
					fromGroup.playout.playingParts = {}
				}
				this._updateTimeline(fromGroup)
				this._updateTimeline(toGroup)
			}
		}

		// Commit the changes.
		this.storage.updateRundown(arg.to.rundownId, toRundown)
		if (fromRundown !== toRundown) {
			this.storage.updateRundown(arg.from.rundownId, fromRundown)
		}

		return {
			undo: async () => {
				await this.movePart({
					from: {
						rundownId: arg.to.rundownId,
						partId: arg.from.partId,
					},
					to: {
						rundownId: arg.from.rundownId,
						groupId: fromGroup.transparent ? null : fromGroup.id,
						position: originalPosition,
					},
				})
			},
			description: ActionDescription.MovePart,
			result: toGroup,
		}
	}
	async duplicatePart(arg: { rundownId: string; groupId: string; partId: string }): Promise<UndoableResult> {
		const { rundown, group, part } = this.getPart(arg)

		// Make a copy of the part, give it and all its children unique IDs, and leave it at the original position.
		const copy = deepClone(part)
		copy.id = short.generate()
		copy.timeline = generateNewTimelineObjIds(copy.timeline)

		let newGroup: Group | undefined = undefined
		if (group.transparent) {
			// We can't place the copy into the already-existing transparent group, so let's make a new one
			newGroup = {
				...getDefaultGroup(),

				id: short.generate(),
				name: copy.name,
				transparent: true,

				parts: [copy],
			}

			this._updateTimeline(newGroup)

			// Add the new group just below the original in the rundown
			const position = rundown.groups.findIndex((g) => g.id === arg.groupId)
			rundown.groups.splice(position + 1, 0, newGroup)
		} else {
			// Add the copy just below the original in the group
			const position = group.parts.findIndex((p) => p.id === arg.partId)
			group.parts.splice(position + 1, 0, copy)
			this._updateTimeline(group)
		}

		// Commit the changes.
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: async () => {
				const { rundown, group } = this.getGroup(arg)

				if (newGroup) {
					// Remove the group we added
					rundown.groups = rundown.groups.filter((g) => (newGroup ? g.id !== newGroup.id : true))
				} else {
					// Remove the part copy we added
					group.parts = group.parts.filter((p) => p.id !== copy.id)
					this._updateTimeline(group)
				}

				// Commit the changes.
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.DuplicatePart,
		}
	}
	async moveGroup(arg: { rundownId: string; groupId: string; position: number }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)

		// Save the original position for use in undo.
		const originalPosition = rundown.groups.findIndex((g) => g.id === arg.groupId)

		// Remove the group from the groups array and re-insert it at its new position
		rundown.groups = rundown.groups.filter((g) => g.id !== arg.groupId)
		rundown.groups.splice(arg.position, 0, group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: async () => {
				await this.moveGroup({
					rundownId: arg.rundownId,
					groupId: arg.groupId,
					position: originalPosition,
				})
			},
			description: ActionDescription.MoveGroup,
		}
	}
	async duplicateGroup(arg: { rundownId: string; groupId: string }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)

		// Make a copy of the group and give it and all its children unique IDs.
		const copy = deepClone(group)
		copy.id = short.generate()
		for (const part of copy.parts) {
			part.id = short.generate()
			part.timeline = generateNewTimelineObjIds(part.timeline)
		}

		// Insert the copy just below the original.
		const originalPosition = rundown.groups.findIndex((g) => g.id === group.id)
		rundown.groups.splice(originalPosition + 1, 0, copy)

		this._updateTimeline(copy)
		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: async () => {
				// Stop playout.
				await this.stopGroup({ rundownId: arg.rundownId, groupId: copy.id })

				// Delete the copy we made.
				rundown.groups = rundown.groups.filter((g) => g.id !== copy.id)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.DuplicateGroup,
		}
	}

	async updateTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)
		const timelineObjPreChange = deepClone(timelineObj)
		const timelineObjIndex = findTimelineObjIndex(part, arg.timelineObjId)

		Object.assign(timelineObj, arg.timelineObj)

		this._updatePart(part)
		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group, part } = this.getPart(arg)

				// Overwrite the changed timeline object with the pre-change copy we made.
				part.timeline.splice(timelineObjIndex, 1, timelineObjPreChange)
				this._updatePart(part)
				this._updateTimeline(group)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.UpdateTimelineObj,
		}
	}
	async deleteTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)
		const timelineObjIndex = findTimelineObjIndex(part, arg.timelineObjId)

		const modified = deleteTimelineObj(part, arg.timelineObjId)

		if (modified) this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				// Re-insert the timelineObj in its original position.
				part.timeline.splice(timelineObjIndex, 0, timelineObj)
				this._updatePart(part)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.DeleteTimelineObj,
		}
	}
	async addTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const existingTimelineObj = findTimelineObj(part, arg.timelineObjId)
		if (existingTimelineObj) throw new Error(`A timelineObj with the ID "${arg.timelineObjId}" already exists.`)
		part.timeline.push(arg.timelineObj)

		this._updatePart(part)
		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group, part } = this.getPart(arg)

				part.timeline = part.timeline.filter((obj) => obj.obj.id !== arg.timelineObjId)

				this._updatePart(part)
				this._updateTimeline(group)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.AddTimelineObj,
		}
	}
	async moveTimelineObjToNewLayer(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`A timelineObj with the ID "${arg.timelineObjId}" could not be found.`)

		if (!timelineObj.resourceId) throw new Error(`TimelineObj "${arg.timelineObjId}" lacks a resourceId.`)
		const resource = this.session.getResource(timelineObj.resourceId)
		if (!resource) throw new Error(`Resource ${timelineObj.resourceId} not found.`)

		const originalLayer = timelineObj.obj.layer
		const result = this._findBestOrCreateLayer({
			rundownId: arg.rundownId,
			groupId: arg.groupId,
			partId: arg.partId,
			obj: timelineObj.obj,
			resource: resource,
		})
		timelineObj.obj.layer = result.layerId

		this._updatePart(part)
		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				if (result.createdNewLayer) {
					// If a new layer was added, remove it.
					const project = this.getProject()
					delete project.mappings[result.layerId]
					this.storage.updateProject(project)
				}

				const { rundown, group, part } = this.getPart(arg)

				timelineObj.obj.layer = originalLayer

				this._updatePart(part)
				this._updateTimeline(group)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.MoveTimelineObjToNewLayer,
		}
	}

	async newTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		if (
			timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
			timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
		) {
			const data = JSON.parse(timelineObj.obj.content.data)
			data[''] = ''
			timelineObj.obj.content.data = JSON.stringify(data)
		} else throw new Error('Not a template')

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				const timelineObj = findTimelineObj(part, arg.timelineObjId)
				if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

				if (
					timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
					timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
				) {
					const data = JSON.parse(timelineObj.obj.content.data)
					delete data['']
					timelineObj.obj.content.data = JSON.stringify(data)
				}

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.NewTemplateData,
		}
	}
	async updateTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string

		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		// Store a snapshot of the data for use in undo.
		let snapshot: string

		if (
			timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
			timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
		) {
			snapshot = timelineObj.obj.content.data
			const data = JSON.parse(timelineObj.obj.content.data)

			if (arg.changedItemId === 'key') {
				// Delete old key and create new
				const oldValue = data[arg.key]
				delete data[arg.key]
				data[arg.value] = oldValue
			} else {
				// Just change value
				data[arg.key] = arg.value
			}

			timelineObj.obj.content.data = JSON.stringify(data)
		} else throw new Error('Not a template')

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				const timelineObj = findTimelineObj(part, arg.timelineObjId)
				if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

				if (
					timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
					timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
				) {
					timelineObj.obj.content.data = snapshot
				}

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.UpdateTemplateData,
		}
	}
	async deleteTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		key: string
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		// Store a snapshot of the data for use in undo.
		let snapshot: string

		if (
			timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
			timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
		) {
			snapshot = timelineObj.obj.content.data
			const data = JSON.parse(timelineObj.obj.content.data)
			delete data[arg.key]
			timelineObj.obj.content.data = JSON.stringify(data)
		} else throw new Error('Not a template')

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				const timelineObj = findTimelineObj(part, arg.timelineObjId)
				if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

				if (
					timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
					timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
				) {
					timelineObj.obj.content.data = snapshot
				}

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.DeleteTemplateData,
		}
	}

	async addResourceToTimeline(arg: {
		rundownId: string
		groupId: string
		partId: string
		layerId: string | null
		resourceId: string
	}): Promise<UndoableResult | null> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return null
		}

		const resource = this.session.getResource(arg.resourceId)
		if (!resource) throw new Error(`Resource ${arg.resourceId} not found.`)

		const obj: TSRTimelineObj = TSRTimelineObjFromResource(resource)

		let addToLayerId: string
		let createdNewLayer = false
		if (arg.layerId) {
			addToLayerId = arg.layerId
		} else {
			const result = this._findBestOrCreateLayer({
				rundownId: arg.rundownId,
				groupId: arg.groupId,
				partId: arg.partId,
				obj,
				resource,
			})
			addToLayerId = result.layerId
			createdNewLayer = result.createdNewLayer
		}
		obj.layer = addToLayerId

		const project = this.getProject()
		const mapping = project.mappings[obj.layer]
		const allow = allowAddingResourceToLayer(project, resource, mapping)
		if (!allow) {
			throw new Error(
				`Prevented addition of resource "${resource.id}" to layer "${mapping.layerName}" because it is of an incompatible type.`
			)
		}

		const timelineObj: TimelineObj = {
			resourceId: resource.id,
			obj,
			resolved: { instances: [] }, // set later
		}

		part.timeline.push(timelineObj)

		this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const project = this.getProject()
				if (createdNewLayer) {
					// If a new layer was added, remove it.
					delete project.mappings[addToLayerId]
					this.storage.updateProject(project)
				}

				const { rundown, part } = this.getPart(arg)
				part.timeline = part.timeline.filter((t) => t.obj.id !== timelineObj.obj.id)
				this._updatePart(part)
				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.AddResourceToTimeline,
		}
	}
	async toggleGroupLoop(arg: { rundownId: string; groupId: string; value: boolean }): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return null
		}

		const originalValue = group.loop

		updateGroupPlayingParts(group)
		group.loop = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.loop = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupLoop,
		}
	}
	async toggleGroupAutoplay(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return null
		}

		const originalValue = group.autoPlay

		updateGroupPlayingParts(group)
		group.autoPlay = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.autoPlay = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupAutoplay,
		}
	}
	async toggleGroupOneAtATime(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return null
		}

		const originalValue = group.oneAtATime

		updateGroupPlayingParts(group)
		group.oneAtATime = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.oneAtATime = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.toggleGroupOneAtATime,
		}
	}
	async toggleGroupDisable(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return null
		}

		const originalValue = group.disabled

		updateGroupPlayingParts(group)
		group.disabled = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.disabled = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupDisable,
		}
	}
	async toggleGroupCollapse(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult | null> {
		const { rundown, group } = this.getGroup(arg)

		const originalValue = group.collapsed

		group.collapsed = arg.value

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				group.collapsed = originalValue

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupCollapse,
		}
	}
	async toggleGroupLock(arg: { rundownId: string; groupId: string; value: boolean }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)
		const originalValue = group.locked

		group.locked = arg.value

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				group.locked = originalValue

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupLock,
		}
	}
	async refreshResources(): Promise<void> {
		this.callbacks.refreshResources()
	}
	async updateProject(data: { id: string; project: Project }): Promise<void> {
		this.storage.updateProject(data.project)
	}
	async newRundown(data: { name: string }): Promise<UndoableResult> {
		this.storage.newRundown(data.name)

		return {
			undo: async () => {
				await this.storage.deleteRundown(data.name)
			},
			description: ActionDescription.NewRundown,
		}
	}
	async deleteRundown(data: { rundownId: string }): Promise<UndoableResult> {
		const { rundown } = this.getRundown(data)

		for (const group of rundown.groups) {
			await this.stopGroup({ rundownId: data.rundownId, groupId: group.id })
		}

		const rundownFileName = this.storage.getRundownFilename(data.rundownId)
		await this.storage.deleteRundown(rundownFileName)

		return {
			undo: () => {
				this.storage.restoreRundown(rundown)
			},
			description: ActionDescription.DeleteRundown,
		}
	}
	async openRundown(data: { rundownId: string }): Promise<UndoableResult> {
		await this.storage.openRundown(data.rundownId)

		return {
			undo: async () => {
				await this.storage.closeRundown(data.rundownId)
			},
			description: ActionDescription.OpenRundown,
		}
	}
	async closeRundown(data: { rundownId: string }): Promise<UndoableResult> {
		const { rundown } = this.getRundown(data)
		if (!rundown) {
			throw new Error(`Rundown "${data.rundownId}" not found`)
		}

		// Stop playout
		for (const group of rundown.groups) {
			await this.stopGroup({ rundownId: data.rundownId, groupId: group.id })
		}

		await this.storage.closeRundown(data.rundownId)

		return {
			undo: async () => {
				await this.storage.openRundown(data.rundownId)
			},
			description: ActionDescription.CloseRundown,
		}
	}
	async listRundowns(data: {
		projectId: string
	}): Promise<{ fileName: string; version: number; name: string; open: boolean }[]> {
		return this.storage.listRundownsInProject(data.projectId)
	}
	async renameRundown(data: { rundownId: string; newName: string }): Promise<UndoableResult> {
		const rundown = this.storage.getRundown(data.rundownId)
		if (!rundown) {
			throw new Error(`Rundown "${data.rundownId}" not found`)
		}

		const originalName = rundown.name
		const newRundownId = await this.storage.renameRundown(data.rundownId, data.newName)

		return {
			undo: async () => {
				await this.storage.renameRundown(newRundownId, originalName)
			},
			description: ActionDescription.RenameRundown,
		}
	}
	async isRundownPlaying(data: { rundownId: string }): Promise<boolean> {
		const { rundown } = this.getRundown(data)

		for (const group of rundown.groups) {
			const playData = getGroupPlayData(group.preparedPlayData)
			if (playData.anyPartIsPlaying) {
				return true
			}
		}

		return false
	}
	async createMissingMapping(data: { rundownId: string; mappingId: string }): Promise<UndoableResult> {
		const project = this.getProject()
		const rundown = this.storage.getRundown(data.rundownId)
		if (!rundown) {
			throw new Error(`Rundown "${data.rundownId}" not found`)
		}

		// Find all timeline objects which reside on the missing layer.
		const createdMappings: { [mappingId: string]: Mapping } = {}

		for (const group of rundown.groups) {
			for (const part of group.parts) {
				for (const timelineObj of part.timeline) {
					if (timelineObj.obj.layer === data.mappingId) {
						if (!timelineObj.resourceId)
							throw new Error(`TimelineObj "${timelineObj.obj.id}" lacks a resourceId.`)

						let deviceId: string | undefined
						const resource = this.session.getResource(timelineObj.resourceId)
						if (resource) {
							deviceId = resource.deviceId
						}
						if (!deviceId) {
							// Pick the first compatible deviceId we find:
							for (const bridge of Object.values(project.bridges)) {
								if (deviceId) break
								for (const [findDeviceId, device] of Object.entries(bridge.settings.devices)) {
									if (device.type === timelineObj.obj.content.deviceType) {
										deviceId = findDeviceId
										break
									}
								}
							}
						}

						if (!deviceId) continue

						const newMapping = getMappingFromTimelineObject(timelineObj.obj, deviceId)
						if (newMapping) {
							createdMappings[data.mappingId] = newMapping
						}
					}
				}
			}
		}

		let newLayerId: string | undefined = undefined
		switch (Object.keys(createdMappings).length) {
			case 0:
				throw new Error('No layer could be automatically created.')
			case 1: {
				newLayerId = Object.keys(createdMappings)[0]
				const newMapping = Object.values(createdMappings)[0]

				if (!newMapping.layerName) {
					throw new Error('INTERNAL ERROR: Layer lacks a name.')
				}

				// Add the new layer to the project
				project.mappings = {
					...project.mappings,
					[newLayerId]: newMapping,
				}
				this.storage.updateProject(project)
				break
			}
			default:
				throw new Error(
					'No layer could be automatically created because the timeline objects on this layer are of incompatible types.'
				)
		}

		return {
			undo: async () => {
				if (newLayerId) {
					const project = this.getProject()
					delete project.mappings[newLayerId]
					this.storage.updateProject(project)
				}
			},
			description: ActionDescription.CreateMissingMapping,
		}
	}

	private _updatePart(part: Part) {
		const resolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0 }
		)
		const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline, false)

		for (const o of part.timeline) {
			const resolvedObj = resolvedTimeline.objects[o.obj.id]
			if (resolvedObj) {
				o.resolved = {
					instances: resolvedObj.resolved.instances.map<TimelineObjResolvedInstance>((i) => ({
						start: i.start,
						end: i.end,
					})),
				}
			} else {
				o.resolved = {
					instances: [],
				}
			}
		}

		part.resolved = {
			duration: maxDuration,
		}
	}
	private _updateTimeline(group: Group) {
		group.preparedPlayData = this.callbacks.updateTimeline(this.updateTimelineCache, group)
		this.callbacks.updatePeripherals(group)
	}
	private _findBestOrCreateLayer(arg: {
		rundownId: string
		groupId: string
		partId: string
		obj: TSRTimelineObj
		resource: ResourceAny
	}) {
		const project = this.getProject()
		const { rundown, part } = this.getPart(arg)
		let addToLayerId: string | null = null
		let createdNewLayer = false

		// First, try to pick next free layer:
		const possibleLayers: { [layerId: string]: number } = {}
		for (const [checkLayerId, checkLayer] of Object.entries(project.mappings)) {
			// Is the layer compatible?
			if (filterMapping(checkLayer, arg.obj)) {
				// Is the layer free?
				if (!part.timeline.find((checkTimelineObj) => checkTimelineObj.obj.layer === checkLayerId)) {
					possibleLayers[checkLayerId] = 1
				}
			}
		}
		// Pick the best layer, ie check which layer contains the most similar objects in other parts:
		for (const group of rundown.groups) {
			for (const part of group.parts) {
				for (const timelineObj of part.timeline) {
					if (possibleLayers[timelineObj.obj.layer]) {
						for (const property of Object.keys(timelineObj.obj.content)) {
							if ((timelineObj.obj.content as any)[property] === (arg.obj.content as any)[property]) {
								possibleLayers[timelineObj.obj.layer]++
							}
						}
					}
				}
			}
		}
		const bestLayer = Object.entries(possibleLayers).reduce(
			(prev, current) => {
				if (current[1] > prev[1]) return current
				return prev
			},
			['', 0]
		)
		if (bestLayer[0]) {
			addToLayerId = bestLayer[0]
		}

		if (!addToLayerId) {
			// If no layer was found, create a new layer:
			const newMapping = getMappingFromTimelineObject(arg.obj, arg.resource.deviceId)

			if (newMapping && newMapping.layerName) {
				// Add the new layer to the project
				const newLayerId = this.storage.convertToFilename(newMapping.layerName)
				project.mappings = {
					...project.mappings,
					[newLayerId]: newMapping,
				}
				this.storage.updateProject(project)
				addToLayerId = newLayerId
				createdNewLayer = true
			}
		}

		if (!addToLayerId) throw new Error('No layer found')

		// Check that the layer exists:
		const layer = addToLayerId ? project.mappings[addToLayerId] : undefined
		if (!layer) throw new Error(`Layer ${addToLayerId} not found.`)

		// Verify that the layer is OK:
		if (!filterMapping(layer, arg.obj)) throw new Error('Not a valid layer for that timeline-object.')

		return { layerId: addToLayerId, createdNewLayer }
	}
}
