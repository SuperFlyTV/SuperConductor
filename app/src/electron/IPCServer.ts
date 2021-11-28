import {
	deleteGroup,
	deleteRundown,
	deleteTimelineObj,
	findGroup,
	findMedia,
	findRundown,
	findTemplate,
	findTimelineObj,
	getResolvedTimelineTotalDuration,
} from '@/lib/util'
import { AppModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
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

	async playRundown(arg: { groupId: string; rundownId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const rundown = findRundown(group, arg.rundownId)
		if (!rundown) throw new Error(`Rundown ${arg.rundownId} not found in group ${arg.groupId}.`)

		if (!group.playout.startTime) {
			// Start playing the queued up items:
			if (!group.playout.rundownIds.length) {
				group.playout.rundownIds = [arg.rundownId]
			} else if (group.playout.rundownIds[0] !== arg.rundownId) {
				group.playout.rundownIds.unshift(arg.rundownId)
			}
		} else {
			// If we're already playing and we hit Play,
			// we should just abort whatever's playing and start playing this instead:

			group.playout.rundownIds = [arg.rundownId]
		}
		// Start playing the group:
		group.playout.startTime = Date.now()

		this._updateTimeline(group)
		this.callbacks.updateViewRef()
	}
	async queueRundownGroup(arg: { groupId: string; rundownId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const rundown = findRundown(group, arg.rundownId)
		if (!rundown) throw new Error(`Rundown ${arg.rundownId} not found in group ${arg.groupId}.`)

		// Add the rundown to the queue:
		group.playout.rundownIds.push(rundown.id)

		this._updateTimeline(group)
		this.callbacks.updateViewRef()
	}
	async unqueueRundownGroup(arg: { groupId: string; rundownId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const rundown = findRundown(group, arg.rundownId)
		if (!rundown) throw new Error(`Rundown ${arg.rundownId} not found in group ${arg.groupId}.`)

		// Remove the last instance of the rundown from the queue:
		const lastIndex = group.playout.rundownIds.lastIndexOf(rundown.id)
		if (lastIndex >= 0) {
			group.playout.rundownIds.splice(lastIndex, 1)
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
			rundownIds: [],
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
		this._updateRundown(found.rundown)
	}
	async newRundown(arg: {
		name: string
		/** The group to create the rundown into. If null; will create a "transparent group" */
		groupId: string | null
	}): Promise<string> {
		const newRundown: RundownModel = {
			id: short.generate(),
			name: arg.name,
			timeline: [],
			resolved: {
				duration: 0,
			},
		}

		if (arg.groupId) {
			// Put rundown into existing group:
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) throw new Error(`Group ${arg.groupId} not found.`)

			group.rundowns.push(newRundown)
		} else {
			// Create a new "transparent group":
			const newGroup: GroupModel = {
				id: short.generate(),
				name: arg.name,
				transparent: true,
				rundowns: [newRundown],
				autoPlay: false,
				loop: false,
				playout: {
					startTime: null,
					rundownIds: [],
				},
				playheadData: null,
			}
			this._appDataRef.groups.push(newGroup)
		}
		this.callbacks.updateViewRef()

		return newRundown.id
	}
	async newGroup(arg: { name: string }): Promise<string> {
		const newGroup: GroupModel = {
			id: short.generate(),
			name: arg.name,
			transparent: false,
			rundowns: [],
			autoPlay: false,
			loop: false,
			playout: {
				startTime: null,
				rundownIds: [],
			},
			playheadData: null,
		}
		this._appDataRef.groups.push(newGroup)
		this.callbacks.updateViewRef()

		return newGroup.id
	}
	async deleteRundown(arg: { groupId: string; rundownId: string }): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		deleteRundown(group, arg.rundownId)

		if (group.transparent && group.rundowns.length === 0) {
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
			rundownIds: [],
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

		if (modified?.rundown) this._updateRundown(modified?.rundown)
		this.callbacks.updateViewRef()
	}
	async addMediaToTimeline(arg: {
		groupId: string
		rundownId: string
		layerId: string
		filename: string
	}): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const rundown = findRundown(group, arg.rundownId)
		if (!rundown) throw new Error(`Rundown ${arg.rundownId} not found.`)

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

		rundown.timeline.push(data)

		this._updateRundown(rundown)
		this.callbacks.updateViewRef()
	}
	async addTemplateToTimeline(arg: {
		groupId: string
		rundownId: string
		layerId: string
		filename: string
	}): Promise<void> {
		const group = findGroup(this._appDataRef, arg.groupId)
		if (!group) throw new Error(`Group ${arg.groupId} not found.`)

		const rundown = findRundown(group, arg.rundownId)
		if (!rundown) throw new Error(`Rundown ${arg.rundownId} not found.`)

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

		rundown.timeline.push(data)

		this._updateRundown(rundown)
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

	private _updateRundown(rundown: RundownModel) {
		const resolvedTimeline = Resolver.resolveTimeline(rundown.timeline, { time: 0 })
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		rundown.resolved = {
			duration: maxDuration,
		}
	}
	private _updateTimeline(group: GroupModel) {
		group.playheadData = this.callbacks.updateTimeline(this.updateTimelineCache, group)
	}
}
