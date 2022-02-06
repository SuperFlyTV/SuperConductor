import {
	allowMovingItemIntoGroup,
	deleteGroup,
	deletePart,
	deleteTimelineObj,
	findGroup,
	findPart,
	findTimelineObj,
	findTimelineObjIndex,
	getResolvedTimelineTotalDuration,
	updateGroupPlaying,
} from '../lib/util'
import { Group } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'
import { Resolver } from 'superfly-timeline'
import { TSRTimelineObj, DeviceType, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'
import { Action, ActionDescription, IPCServerMethods, MAX_UNDO_LEDGER_LENGTH, UndoableResult } from '../ipc/IPCAPI'
import { UpdateTimelineCache } from './timeline'
import short from 'short-uuid'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { Rundown } from '../models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import { ResourceType } from '@shared/models'
import { assertNever, deepClone } from '@shared/lib'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { Project } from '../models/project/Project'
import EventEmitter from 'events'
import TypedEmitter from 'typed-emitter'
import { filterMapping, getMappingFromTimelineObject } from '../lib/TSRMappings'
import { getDefaultGroup } from './defaults'

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
		private storage: StorageHandler,
		private session: SessionHandler,
		private callbacks: {
			// updateViewRef: () => void
			updateTimeline: (cache: UpdateTimelineCache, group: Group) => GroupPreparedPlayData | null
			refreshResources: () => void
		}
	) {
		super()
		for (const methodName of Object.keys(IPCServer.prototype)) {
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

		const group = findGroup(rundown, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found in rundown "${arg.rundownId}" ("${rundown.name}").`)

		return { rundown, group }
	}
	private getPart(arg: { rundownId: string; groupId: string; partId: string }): {
		rundown: Rundown
		group: Group
		part: Part
	} {
		const { rundown, group } = this.getGroup(arg)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found in group ${arg.groupId} ("${group.name}").`)

		return { rundown, group, part }
	}
	async undo(): Promise<void> {
		const action = this.undoLedger[this.undoPointer]
		try {
			await action.undo()
			this.undoPointer--
		} catch (error) {
			console.error('Error when undoing:', error)

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
			console.error('Error when redoing:', error)

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

	async playPart(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const { rundown, group } = this.getPart(arg)

		if (group.oneAtATime) {
			// Anything already playing should be stopped:
			group.playout.playingParts = {}
		}
		if (!group.playout.playingParts) group.playout.playingParts = {}
		// Start playing this Part:
		group.playout.playingParts[arg.partId] = {
			startTime: Date.now(),
		}

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
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
	async stopGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		// Stop the group:
		group.playout.playingParts = {}

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async newPart(arg: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
		name: string
	}): Promise<UndoableResult<string>> {
		const newPart: Part = {
			id: short.generate(),
			name: arg.name,
			timeline: [],
			resolved: {
				duration: 0,
			},
		}

		const { rundown } = this.getRundown(arg)

		let transparentGroupId: string | undefined
		if (arg.groupId) {
			// Put part into existing group:
			const { group } = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })

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
			result: newPart.id,
		}
	}
	async updatePart(arg: { rundownId: string; groupId: string; partId: string; part: Part }): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)

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
	async updateGroup(arg: { rundownId: string; groupId: string; group: Group }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)

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
	async deletePart(arg: { rundownId: string; groupId: string; partId: string }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)

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
	async deleteGroup(arg: { rundownId: string; groupId: string }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)

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
		from: { rundownId: string; groupId: string; partId: string }
		to: { rundownId: string; groupId: string | null; position: number }
	}): Promise<UndoableResult<Group> | undefined> {
		let fromRundown: Rundown
		let fromGroup: Group
		let part: Part
		// @TODO (Alex Van Camp): I'm not sure why this try/catch is necessary, but it is.
		try {
			const getPartResult = this.getPart(arg.from)
			fromRundown = getPartResult.rundown
			fromGroup = getPartResult.group
			part = getPartResult.part
		} catch (error) {
			// Ignore
			console.log('movePart caught error:', (error as any).message)
			return
		}
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

					parts: [part],
				}
				madeNewTransparentGroup = true
			}
		}

		const allow = allowMovingItemIntoGroup(arg.from.partId, fromGroup, toGroup)

		if (!allow) {
			return
		}

		const fromPlayhead = allow.fromPlayhead
		const toPlayhead = allow.toPlayhead
		const movedPartIsPlaying = fromPlayhead.playheads[arg.from.partId]

		// Save the original position for use in undo.
		const originalPosition = fromGroup.transparent
			? fromRundown.groups.findIndex((g) => g.id === arg.from.groupId)
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

				if (movedPartIsPlaying && !toGroup.oneAtATime) {
					// Update the group's playhead, so that the currently playing
					// part continues to play as if nothing happened:
					toGroup.playout.playingParts = {
						[arg.from.partId]: {
							startTime: movedPartIsPlaying.partStartTime,
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
						groupId: toGroup.id,
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

	async updateTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}): Promise<UndoableResult> {
		const { rundown, group, part } = this.getPart(arg)

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
	}): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)

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

	async newTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)

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
	}): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)

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
	}): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)

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
	}): Promise<UndoableResult> {
		const { rundown, part } = this.getPart(arg)

		const resource = this.session.getResource(arg.resourceId)
		if (!resource) throw new Error(`Resource ${arg.resourceId} not found.`)

		// @ts-expect-error duration
		const duration = (resource.duration || 5) * 1000

		let obj: TSRTimelineObj

		if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
			obj = {
				id: short.generate(),
				layer: '', // set later
				enable: {
					start: 0,
					duration,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: resource.name,
				},
			}
		} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
			obj = {
				id: short.generate(),
				layer: '', // set later
				enable: {
					start: 0,
					duration: 5 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.TEMPLATE,
					templateType: 'html',
					name: resource.name,
					data: JSON.stringify({}),
					useStopCommand: true,
				},
			}
		} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
			throw new Error(`The resource "${resource.resourceType}" can't be added to a timeline.`)
		} else {
			assertNever(resource)
			// @ts-expect-error never
			throw new Error(`Unknown resource type "${resource.resourceType}"`)
		}

		const project = this.getProject()
		let addToLayerId: string | null = arg.layerId

		if (!addToLayerId) {
			// First, try to pick next free layer:
			const possibleLayers: { [layerId: string]: number } = {}
			for (const [checkLayerId, checkLayer] of Object.entries(project.mappings)) {
				// Is the layer compatible?
				if (filterMapping(checkLayer, obj)) {
					// Is the layer free?
					if (!part.timeline.find((checkTimelineObj) => checkTimelineObj.obj.layer === checkLayerId)) {
						possibleLayers[checkLayerId] = 1
					}
				}
			}
			// Pick the best layer, ie check which layer contains the most similar objects in other parts:
			const rundown = this.getRundown({ rundownId: arg.rundownId })
			for (const group of rundown.rundown.groups) {
				for (const part of group.parts) {
					for (const timelineObj of part.timeline) {
						if (possibleLayers[timelineObj.obj.layer]) {
							for (const property of Object.keys(timelineObj.obj.content)) {
								if ((timelineObj.obj.content as any)[property] === (obj.content as any)[property]) {
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
		}

		let newLayerId = ''
		if (!addToLayerId) {
			// If no layer was found, create a new layer:
			const newMapping = getMappingFromTimelineObject(obj, resource.deviceId)

			if (newMapping && newMapping.layerName) {
				// Add the new layer to the project
				newLayerId = this.storage.convertToFilename(newMapping.layerName)
				project.mappings = {
					...project.mappings,
					[newLayerId]: newMapping,
				}
				this.storage.updateProject(project)
				addToLayerId = newLayerId
			}
		}

		if (!addToLayerId) throw new Error('No layer found')

		// Check that the layer exists:
		const layer = addToLayerId ? project.mappings[addToLayerId] : undefined
		if (!layer) throw new Error(`Layer ${addToLayerId} not found.`)

		// Verify that the layer is OK:
		if (!filterMapping(layer, obj)) throw new Error('Not a valid mapping for that timeline-object.')
		obj.layer = addToLayerId

		const timelineObj: TimelineObj = {
			resourceId: resource.id,
			obj,
		}

		part.timeline.push(timelineObj)

		this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const project = this.getProject()
				if (newLayerId) {
					// If a new layer was added, remove it.
					delete project.mappings[newLayerId]
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
	async toggleGroupLoop(arg: { rundownId: string; groupId: string; value: boolean }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)
		const originalValue = group.loop

		updateGroupPlaying(group)
		group.loop = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlaying(group)
				group.loop = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupLoop,
		}
	}
	async toggleGroupAutoplay(arg: { rundownId: string; groupId: string; value: boolean }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)
		const originalValue = group.autoPlay

		updateGroupPlaying(group)
		group.autoPlay = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlaying(group)
				group.autoPlay = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.ToggleGroupAutoplay,
		}
	}
	async toggleGroupOneAtATime(arg: { rundownId: string; groupId: string; value: boolean }): Promise<UndoableResult> {
		const { rundown, group } = this.getGroup(arg)
		const originalValue = group.oneAtATime

		updateGroupPlaying(group)
		group.oneAtATime = arg.value
		this._updateTimeline(group)

		this.storage.updateRundown(arg.rundownId, rundown)

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlaying(group)
				group.oneAtATime = originalValue
				this._updateTimeline(group)

				this.storage.updateRundown(arg.rundownId, rundown)
			},
			description: ActionDescription.toggleGroupOneAtATime,
		}
	}
	async refreshResources(): Promise<void> {
		this.callbacks.refreshResources()
	}
	async updateProject(data: { id: string; project: Project }): Promise<void> {
		const rundowns = this.storage.getAllRundowns()

		for (const rundown of rundowns) {
			// Go through all Parts and remove any timelineObjs belonging to layers which have been removed.
			let modifiedTimeline = false
			for (const group of rundown.groups) {
				for (const part of group.parts) {
					const timelineObjsToRemove: TimelineObj[] = []
					for (const timelineObj of part.timeline) {
						if (!(timelineObj.obj.layer in data.project.mappings)) {
							timelineObjsToRemove.push(timelineObj)
						}
					}
					if (timelineObjsToRemove.length) {
						part.timeline = part.timeline.filter(
							(timelineObj) => !timelineObjsToRemove.includes(timelineObj)
						)
						modifiedTimeline = true
						this._updatePart(part)
					}
				}
				if (modifiedTimeline) {
					this._updateTimeline(group)
				}
			}
			if (modifiedTimeline) {
				this.storage.updateRundown(rundown.id, rundown)
			}
		}

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

	private _updatePart(part: Part) {
		const resolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0 }
		)
		const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		part.resolved = {
			duration: maxDuration,
		}
	}
	private _updateTimeline(group: Group) {
		group.preparedPlayData = this.callbacks.updateTimeline(this.updateTimelineCache, group)
	}
}
