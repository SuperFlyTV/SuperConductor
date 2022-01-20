import {
	deleteGroup,
	deletePart,
	deleteTimelineObj,
	findGroup,
	findPart,
	findTimelineObj,
	getCurrentlyPlayingInfo,
	getResolvedTimelineTotalDuration,
} from '@/lib/util'
import { Group } from '@/models/rundown/Group'
import { Part } from '@/models/rundown/Part'
import { Resolver, TimelineEnable } from 'superfly-timeline'
import { TSRTimelineObj, DeviceType, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'
import { IPCServerMethods } from '../ipc/IPCAPI'
import { UpdateTimelineCache } from './timeline'
import short from 'short-uuid'
import { GroupPreparedPlayheadData } from '@/models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { Rundown } from '@/models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import { ResourceType } from '@/models/resource/resource'
import { assertNever } from '@/lib/lib'
import { TimelineObj } from '@/models/rundown/TimelineObj'

/** This class is used server-side, to handle requests from the client */
export class IPCServer implements IPCServerMethods {
	private updateTimelineCache: UpdateTimelineCache = {}

	constructor(
		ipcMain: Electron.IpcMain,
		private storage: StorageHandler,
		private session: SessionHandler,
		private callbacks: {
			// updateViewRef: () => void
			updateTimeline: (cache: UpdateTimelineCache, group: Group) => GroupPreparedPlayheadData | null
			refreshResources: () => void
		}
	) {
		for (const methodName of Object.keys(IPCServer.prototype)) {
			if (methodName[0] !== '_') {
				const fcn = (this as any)[methodName] as Function
				if (fcn) {
					ipcMain.handle(methodName, async (event, ...args) => {
						return fcn.apply(this, args)
					})
				}
			}
		}
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
	async triggerSendAll(): Promise<void> {
		this.storage.triggerEmitAll()
		this.session.triggerEmitAll()
	}
	async triggerSendRundown(arg: { rundownId: string }): Promise<void> {
		this.storage.triggerEmitRundown(arg.rundownId)
	}

	async playPart(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const { rundown, group, part } = this.getPart(arg)

		if (!group.playout.startTime) {
			// Start playing the queued up items:
			if (!group.playout.partIds.length) {
				group.playout.partIds = [arg.partId]
			} else if (group.playout.partIds[0] !== arg.partId) {
				group.playout.partIds.unshift(arg.partId)
			}
		} else {
			// If we're already playing and we hit Play,
			// we should just abort whatever's playing and start playing this instead:

			group.playout.partIds = [arg.partId]
		}
		// Start playing the group:
		group.playout.startTime = Date.now()

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async queuePartGroup(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const { rundown, group, part } = this.getPart(arg)

		// Add the part to the queue:
		group.playout.partIds.push(part.id)

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async unqueuePartGroup(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const { rundown, group, part } = this.getPart(arg)

		// Remove the last instance of the part from the queue:
		const lastIndex = group.playout.partIds.lastIndexOf(part.id)
		if (lastIndex >= 0) {
			group.playout.partIds.splice(lastIndex, 1)
		}

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async stopGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		// Stop the group:
		group.playout = {
			startTime: null,
			partIds: [],
		}

		this._updateTimeline(group)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async newPart(arg: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
		name: string
	}): Promise<string> {
		const newPart: Part = {
			id: short.generate(),
			name: arg.name,
			timeline: [],
			resolved: {
				duration: 0,
			},
		}

		const { rundown } = this.getRundown(arg)

		if (arg.groupId) {
			// Put part into existing group:
			const { group } = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })

			group.parts.push(newPart)
		} else {
			// Create a new "transparent group":
			const newGroup: Group = {
				id: short.generate(),
				name: arg.name,
				transparent: true,
				parts: [newPart],
				autoPlay: false,
				loop: false,
				playout: {
					startTime: null,
					partIds: [],
				},
				playheadData: null,
			}
			rundown.groups.push(newGroup)
		}
		this.storage.updateRundown(arg.rundownId, rundown)

		return newPart.id
	}
	async newGroup(arg: { rundownId: string; name: string }): Promise<string> {
		const newGroup: Group = {
			id: short.generate(),
			name: arg.name,
			transparent: false,
			parts: [],
			autoPlay: false,
			loop: false,
			playout: {
				startTime: null,
				partIds: [],
			},
			playheadData: null,
		}
		const { rundown } = this.getRundown(arg)

		rundown.groups.push(newGroup)
		this.storage.updateRundown(arg.rundownId, rundown)

		return newGroup.id
	}
	async deletePart(arg: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		deletePart(group, arg.partId)

		if (group.transparent && group.parts.length === 0) {
			deleteGroup(rundown, group.id)
		}

		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async deleteGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		// Stop the group (so that the updates are sent to TSR):
		group.playout = {
			startTime: null,
			partIds: [],
		}

		this._updateTimeline(group)
		deleteGroup(rundown, group.id)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async movePart(arg: {
		from: { rundownId: string; groupId: string; partId: string }
		to: { rundownId: string; groupId: string | null; position: number }
	}): Promise<Group | undefined> {
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
		const isMovingToNewGroup = arg.from.groupId !== arg.to.groupId
		let toRundown: Rundown
		let toGroup: Group
		let madeNewTransparentGroup = false
		let isTransparentGroupMove =
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
					id: short.generate(),
					name: part.name,
					transparent: true,
					parts: [part],
					autoPlay: false,
					loop: false,
					playout: {
						startTime: null,
						partIds: [],
					},
					playheadData: null,
				}
				madeNewTransparentGroup = true
			}
		}

		// Get information about currently-playing Parts.
		const { playoutDelta: fromGroupPlayoutDelta, partPlayheadData: fromGroupPartPlayheadData } =
			getCurrentlyPlayingInfo(fromGroup)
		const movedPartIsPlaying = Boolean(
			fromGroupPartPlayheadData && fromGroupPartPlayheadData.part.id === arg.from.partId
		)
		const toGroupIsPlaying = Boolean(toGroup.playheadData)

		// Don't allow moving a currently-playing Part into a Group which is already playing.
		if (movedPartIsPlaying && isMovingToNewGroup && toGroupIsPlaying) {
			return
		}

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
				if (typeof fromGroupPlayoutDelta === 'number' && fromGroupPartPlayheadData) {
					const timeIntoPart = fromGroupPlayoutDelta - fromGroupPartPlayheadData.startTime
					fromGroup.playout.startTime = Date.now() - timeIntoPart
					fromGroup.playout.partIds = [fromGroupPartPlayheadData.part.id]
				}
				this._updateTimeline(fromGroup)
			} else {
				// Inter-group move.
				if (movedPartIsPlaying && !toGroupIsPlaying) {
					fromGroup.playout.partIds = fromGroup.playout.partIds.filter((id) => id !== arg.from.partId)
					toGroup.playout.partIds.push(arg.from.partId)
					toGroup.playout.startTime = fromGroup.playout.startTime
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

		return toGroup
	}

	async updateTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}): Promise<void> {
		const { rundown, part } = this.getPart(arg)

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		Object.assign(timelineObj, arg.timelineObj)

		this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async deleteTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<void> {
		const { rundown, part } = this.getPart(arg)

		const modified = deleteTimelineObj(part, arg.timelineObjId)

		if (modified) this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)
	}

	async newTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<void> {
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
	}
	async updateTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string

		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}): Promise<void> {
		const { rundown, part } = this.getPart(arg)

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		if (
			timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
			timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
		) {
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
	}
	async deleteTemplateData(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		key: string
	}): Promise<void> {
		const { rundown, part } = this.getPart(arg)

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		if (
			timelineObj.obj.content.deviceType === DeviceType.CASPARCG &&
			timelineObj.obj.content.type === TimelineContentTypeCasparCg.TEMPLATE
		) {
			const data = JSON.parse(timelineObj.obj.content.data)
			delete data[arg.key]
			timelineObj.obj.content.data = JSON.stringify(data)
		} else throw new Error('Not a template')

		this.storage.updateRundown(arg.rundownId, rundown)
	}

	async addResourceToTimeline(arg: {
		rundownId: string
		groupId: string
		partId: string
		layerId: string
		resourceId: string
	}): Promise<void> {
		const { rundown, part } = this.getPart(arg)

		const resource = this.session.getResource(arg.resourceId)
		if (!resource) throw new Error(`Resource ${arg.resourceId} not found.`)

		// @ts-expect-error duration
		let duration = (resource.duration || 5) * 1000

		let obj: TSRTimelineObj

		if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
			obj = {
				id: short.generate(),
				layer: arg.layerId,
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
				layer: arg.layerId,
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

		const timelineObj: TimelineObj = {
			resourceId: resource.id,
			obj,
		}

		part.timeline.push(timelineObj)

		this._updatePart(part)
		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async toggleGroupLoop(arg: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		group.loop = arg.value

		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async toggleGroupAutoplay(arg: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		group.autoPlay = arg.value

		this.storage.updateRundown(arg.rundownId, rundown)
	}
	async refreshResources(): Promise<void> {
		this.callbacks.refreshResources()
	}

	private _updatePart(part: Part) {
		const resolvedTimeline = Resolver.resolveTimeline(
			part.timeline.map((o) => o.obj),
			{ time: 0 }
		)
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		part.resolved = {
			duration: maxDuration,
		}
	}
	private _updateTimeline(group: Group) {
		group.playheadData = this.callbacks.updateTimeline(this.updateTimelineCache, group)
	}
}
