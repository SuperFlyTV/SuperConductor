import {
	deleteGroup,
	deletePart,
	deleteTimelineObj,
	findGroup,
	findMedia,
	findPart,
	findTemplate,
	findTimelineObj,
	getResolvedTimelineTotalDuration,
} from '@/lib/util'
import { AppModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { PartModel } from '@/models/PartModel'
import { Resolver, TimelineEnable } from 'superfly-timeline'
import { TSRTimelineObj, DeviceType, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'
import { IPCServerMethods } from '../ipc/IPCAPI'
import { UpdateTimelineCache } from './timeline'
import short from 'short-uuid'
import { GroupPreparedPlayheadData } from '@/models/PlayheadData'

/** This class is used server-side, to handle requests from the client */
export class IPCServer implements IPCServerMethods {
	private updateTimelineCache: UpdateTimelineCache = {}

	constructor(
		ipcMain: Electron.IpcMain,
		private _appDataRef: AppModel,
		private callbacks: {
			updateViewRef: () => void
			updateTimeline: (cache: UpdateTimelineCache, group: GroupModel) => GroupPreparedPlayheadData | null
			refreshMediaRef: () => void
			refreshTemplatesRef: () => void
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
		// IPCServer.prototype
	}
	async triggerAppFeed(): Promise<void> {
		this.callbacks.updateViewRef()
	}

	async playPart(arg: { groupId: string; partId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found in group ${arg.groupId}.`)

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
		this.callbacks.updateViewRef()
	}
	async queuePartGroup(arg: { groupId: string; partId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found in group ${arg.groupId}.`)

		// Add the part to the queue:
		group.playout.partIds.push(part.id)

		this._updateTimeline(group)
		this.callbacks.updateViewRef()
	}
	async unqueuePartGroup(arg: { groupId: string; partId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found in group ${arg.groupId}.`)

		// Remove the last instance of the part from the queue:
		const lastIndex = group.playout.partIds.lastIndexOf(part.id)
		if (lastIndex >= 0) {
			group.playout.partIds.splice(lastIndex, 1)
		}

		this._updateTimeline(group)
		this.callbacks.updateViewRef()
	}
	async stopGroup(arg: { groupId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		// Stop the group:
		group.playout = {
			startTime: null,
			partIds: [],
		}

		this._updateTimeline(group)
		this.callbacks.updateViewRef()
	}
	async updateTimelineObj(arg: {
		timelineObjId: string
		enableStart: number
		enableDuration: number
		layer: string | number
	}): Promise<void> {
		const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
		if (!found) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		const enable = found.timelineObj.enable as TimelineEnable
		enable.start = arg.enableStart
		enable.duration = arg.enableDuration
		found.timelineObj.layer = arg.layer

		this.callbacks.updateViewRef()
		this._updatePart(found.part)
	}
	async newPart(arg: {
		name: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
	}): Promise<string> {
		const newPart: PartModel = {
			id: short.generate(),
			name: arg.name,
			timeline: [],
			resolved: {
				duration: 0,
			},
		}

		if (arg.groupId) {
			// Put part into existing group:
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) throw new Error(`Group ${arg.groupId} not found.`)

			group.parts.push(newPart)
		} else {
			// Create a new "transparent group":
			const newGroup: GroupModel = {
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
			this._appDataRef.groups.push(newGroup)
		}
		this.callbacks.updateViewRef()

		return newPart.id
	}
	async newGroup(arg: { name: string }): Promise<string> {
		const newGroup: GroupModel = {
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
		this._appDataRef.groups.push(newGroup)
		this.callbacks.updateViewRef()

		return newGroup.id
	}
	async deletePart(arg: { groupId: string; partId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		deletePart(group, arg.partId)

		if (group.transparent && group.parts.length === 0) {
			deleteGroup(this._appDataRef, arg.groupId)
		}

		this.callbacks.updateViewRef()
	}
	async deleteGroup(arg: { groupId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		// Stop the group (so that the updates are sent to TSR):
		group.playout = {
			startTime: null,
			partIds: [],
		}

		this._updateTimeline(group)
		deleteGroup(this._appDataRef, group.id)
		this.callbacks.updateViewRef()
	}
	async newTemplateData(arg: { timelineObjId: string }): Promise<void> {
		const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
		if (!found) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		const data = JSON.parse((found.timelineObj.content as any).data)
		data[''] = ''
		;(found.timelineObj.content as any).data = JSON.stringify(data)

		this.callbacks.updateViewRef()
	}
	async updateTemplateData(arg: {
		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}): Promise<void> {
		const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
		if (!found) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		const data = JSON.parse((found.timelineObj.content as any).data)

		if (arg.changedItemId === 'key') {
			// Delete old key and create new
			const oldValue = data[arg.key]
			delete data[arg.key]
			data[arg.value] = oldValue
		} else {
			// Just change value
			data[arg.key] = arg.value
		}

		;(found.timelineObj.content as any).data = JSON.stringify(data)
		this.callbacks.updateViewRef()
	}
	async deleteTemplateData(arg: { timelineObjId: string; key: string }): Promise<void> {
		const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
		if (!found) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)

		const content = found.timelineObj.content as any

		const data = JSON.parse(content.data)
		delete data[arg.key]
		content.data = JSON.stringify(data)

		this.callbacks.updateViewRef()
	}
	async deleteTimelineObj(arg: { timelineObjId: string }): Promise<void> {
		const modified = deleteTimelineObj(this._appDataRef, arg.timelineObjId)

		if (modified?.part) this._updatePart(modified?.part)
		this.callbacks.updateViewRef()
	}
	async addMediaToTimeline(arg: { groupId: string; partId: string; layerId: string; filename: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found.`)

		const media = findMedia(this._appDataRef.media, arg.filename)
		if (!media) throw new Error(`Media ${arg.filename} not found.`)

		let duration = 5000
		if (media.duration > 0) {
			duration = media.duration * 1000
		}

		const data: TSRTimelineObj = {
			id: short.generate(),
			layer: arg.layerId,
			enable: {
				start: 0,
				duration,
			},
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				file: arg.filename,
			},
		}

		part.timeline.push(data)

		this._updatePart(part)
		this.callbacks.updateViewRef()
	}
	async addTemplateToTimeline(arg: {
		groupId: string
		partId: string
		layerId: string
		filename: string
	}): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const part = findPart(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found.`)

		const template = findTemplate(this._appDataRef.templates, arg.filename)
		if (!template) throw new Error(`Template ${arg.filename} not found.`)

		const data: TSRTimelineObj = {
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
				name: arg.filename,
				data: JSON.stringify({}),
				useStopCommand: true,
			},
		}

		part.timeline.push(data)

		this._updatePart(part)
		this.callbacks.updateViewRef()
	}
	async toggleGroupLoop(arg: { groupId: string; value: boolean }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		group.loop = arg.value

		this.callbacks.updateViewRef()
	}
	async toggleGroupAutoplay(arg: { groupId: string; value: boolean }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		group.autoPlay = arg.value

		this.callbacks.updateViewRef()
	}
	async refreshMedia(): Promise<void> {
		this.callbacks.refreshMediaRef()
	}
	async refreshTemplates(): Promise<void> {
		this.callbacks.refreshTemplatesRef()
	}

	private _updatePart(part: PartModel) {
		const resolvedTimeline = Resolver.resolveTimeline(part.timeline, { time: 0 })
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		part.resolved = {
			duration: maxDuration,
		}
	}
	private _updateTimeline(group: GroupModel) {
		group.playheadData = this.callbacks.updateTimeline(this.updateTimelineCache, group)
	}
}
