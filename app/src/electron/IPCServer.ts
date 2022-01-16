import {
	deleteGroup,
	deletePart,
	deleteTimelineObj,
	findGroup,
	findPart,
	findTimelineObj,
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
		if (!group) throw new Error(`Group ${arg.groupId} not found in rundown "${arg.rundownId}".`)

		return { rundown, group }
	}
	private getPart(arg: { rundownId: string; groupId: string; partId: string }): {
		rundown: Rundown
		group: Group
		part: Part
	} {
		const { rundown, group } = this.getGroup(arg)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found in group ${arg.groupId}.`)

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
		to: { rundownId: string; groupId: string; position: number }
	}): Promise<void> {
		const { rundown: fromRundown, group: fromGroup, part } = this.getPart(arg.from)
		const { rundown: toRundown, group: toGroup } = this.getGroup(arg.to)

		// Remove the part from its original group.
		fromGroup.parts = fromGroup.parts.filter((p) => p.id !== arg.from.partId)

		// Add the part to its new group, in its new position.
		toGroup.parts.splice(arg.to.position, 0, part)

		// Update playout and playhead data (currently only supports intra-group moves).
		if (fromGroup.playheadData) {
			this._updateTimeline(fromGroup)
		}

		// Commit the changes.
		this.storage.updateRundown(arg.to.rundownId, toRundown)
		if (arg.to.rundownId !== arg.from.rundownId) {
			this.storage.updateRundown(arg.from.rundownId, fromRundown)
		}
	}

	async updateTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string

		timelineObjId: string
		enableStart: number
		enableDuration: number
		layer: string | number
	}): Promise<void> {
		const { rundown, part } = this.getPart(arg)

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		const enable = timelineObj.obj.enable as TimelineEnable
		enable.start = arg.enableStart
		enable.duration = arg.enableDuration
		timelineObj.obj.layer = arg.layer

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
