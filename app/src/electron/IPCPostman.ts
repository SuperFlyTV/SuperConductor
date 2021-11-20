import { ipcMain } from 'electron'
import short from 'short-uuid'
import { TsrBridgeApi } from './api/TsrBridge'
import { DeviceType, TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'

import {
	APP_FEED_CHANNEL,
	PLAY_RUNDOWN_CHANNEL,
	SELECT_TIMELINE_OBJ_CHANNEL,
	STOP_GROUP_CHANNEL,
	IUpdateTimelineObj,
	UPDATE_TIMELINE_OBJ_CHANNEL,
	NEW_RUNDOWN_CHANNEL,
	INewRundown,
	UPDATE_TEMPLATE_DATA_CHANNEL,
	IUpdateTemplateDataChannel,
	NEW_TEMPLATE_DATA_CHANNEL,
	INewTemplateDataChannel,
	DELETE_TEMPLATE_DATA_CHANNEL,
	IDeleteTemplateDataChannel,
	DELETE_TIMELINE_OBJ_CHANNEL,
	IDeleteTimelineObjChannel,
	ADD_MEDIA_TO_TIMELINE_CHANNEL,
	IAddMediaToTimelineChannel,
	ADD_TEMPLATE_TO_TIMELINE_CHANNEL,
	IAddTemplateToTimelineChannel,
	DELETE_RUNDOWN_CHANNEL,
	IDeleteRundown,
	TOGGLE_GROUP_LOOP_CHANNEL,
	IToggleGroupLoop,
	REFRESH_MEDIA_CHANNEL,
	REFRESH_TEMPLATES_CHANNEL,
	IPlayRundown,
	NEW_GROUP_CHANNEL,
	DELETE_GROUP_CHANNEL,
	IDeleteGroup,
	TOGGLE_GROUP_AUTOPLAY_CHANNEL,
	IToggleAutoPlayLoop,
	INewGroup,
} from '@/ipc/channels'

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
import { Resolver } from 'superfly-timeline'
import { RundownModel } from '@/models/RundownModel'
import { GroupModel } from '@/models/GroupModel'
import { updateTimeline, UpdateTimelineCache } from './timeline'

export class IPCPostman {
	private updateTimelineCache: UpdateTimelineCache = {}

	constructor(
		private _appDataRef: AppModel,
		private _updateViewRef: () => void,
		private _refreshMediaRef: () => void,
		private _refreshTemplatesRef: () => void
	) {
		this.initIPCChannels()
	}

	initIPCChannels() {
		ipcMain.on(APP_FEED_CHANNEL, async (event, arg) => {
			this._updateViewRef()
		})

		ipcMain.on(REFRESH_MEDIA_CHANNEL, async (event, arg) => {
			this._refreshMediaRef()
		})

		ipcMain.on(REFRESH_TEMPLATES_CHANNEL, async (event, arg) => {
			this._refreshTemplatesRef()
		})

		ipcMain.on(PLAY_RUNDOWN_CHANNEL, async (event, arg: IPlayRundown) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) {
				console.error(`Group ${arg.groupId} not found.`)
				return
			} else {
				const rd = findRundown(group, arg.rundownId)
				if (!rd) {
					console.error(`Rundown ${arg.rundownId} not found in group ${arg.groupId}.`)
					return
				} else {
					// Start playing the group:
					group.playing = {
						startTime: Date.now(),
						startRundownId: arg.rundownId,
					}
				}
			}

			this.updateTimeline(group)
			this._updateViewRef()
		})

		ipcMain.on(STOP_GROUP_CHANNEL, async (event, arg) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) {
				console.error(`Group ${arg.groupId} not found.`)
				return
			}
			// Stop the group:
			group.playing = null

			this.updateTimeline(group)
			this._updateViewRef()
		})

		ipcMain.on(SELECT_TIMELINE_OBJ_CHANNEL, async (event, arg) => {
			this._appDataRef.selectedTimelineObjId = arg
			this._updateViewRef()
		})

		ipcMain.on(UPDATE_TIMELINE_OBJ_CHANNEL, async (event, arg: IUpdateTimelineObj) => {
			const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
			if (!found) return
			;(found.timelineObj.enable as any).start = arg.enableStart
			;(found.timelineObj.enable as any).duration = arg.enableDuration
			found.timelineObj.layer = arg.layer

			this._updateViewRef()
			this.updateRundown(found.rundown)
		})

		ipcMain.on(NEW_RUNDOWN_CHANNEL, async (event, arg: INewRundown) => {
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
				if (!group) {
					console.error(`Group ${arg.groupId} not found.`)
					return
				}
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
					playing: null,
					playheadData: null,
				}
				this._appDataRef.groups.push(newGroup)
			}
			this._updateViewRef()
		})

		ipcMain.on(NEW_GROUP_CHANNEL, async (event, arg: INewGroup) => {
			const newGroup: GroupModel = {
				id: short.generate(),
				name: arg.name,
				transparent: false,
				rundowns: [],
				autoPlay: false,
				loop: false,
				playing: null,
				playheadData: null,
			}
			this._appDataRef.groups.push(newGroup)
			this._updateViewRef()
		})

		ipcMain.on(DELETE_RUNDOWN_CHANNEL, async (event, arg: IDeleteRundown) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) {
				console.error(`Group ${arg.groupId} not found.`)
				return
			}

			deleteRundown(group, arg.rundownId)

			if (group.transparent && group.rundowns.length === 0) {
				deleteGroup(this._appDataRef, arg.groupId)
			}

			this._updateViewRef()
		})

		ipcMain.on(DELETE_GROUP_CHANNEL, async (event, arg: IDeleteGroup) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) {
				console.error(`Group ${arg.groupId} not found.`)
				return
			}

			deleteGroup(this._appDataRef, group.id)
			this.updateTimeline(group)
			this._updateViewRef()
		})

		/**
		 * TODO - fix changing order
		 */
		ipcMain.on(UPDATE_TEMPLATE_DATA_CHANNEL, async (event, arg: IUpdateTemplateDataChannel) => {
			const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
			if (!found) return

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
			this._updateViewRef()
		})

		ipcMain.on(NEW_TEMPLATE_DATA_CHANNEL, async (event, arg: INewTemplateDataChannel) => {
			const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found.timelineObj.content as any).data)
			data[''] = ''
			;(found.timelineObj.content as any).data = JSON.stringify(data)

			this._updateViewRef()
		})

		ipcMain.on(DELETE_TEMPLATE_DATA_CHANNEL, async (event, arg: IDeleteTemplateDataChannel) => {
			const found = findTimelineObj(this._appDataRef, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found.timelineObj.content as any).data)
			delete data[arg.key]
			;(found.timelineObj.content as any).data = JSON.stringify(data)

			this._updateViewRef()
		})

		ipcMain.on(DELETE_TIMELINE_OBJ_CHANNEL, async (event, arg: IDeleteTimelineObjChannel) => {
			const modified = deleteTimelineObj(this._appDataRef, arg.timelineObjId)

			if (modified?.rundown) this.updateRundown(modified?.rundown)
			this._updateViewRef()
		})

		ipcMain.on(ADD_MEDIA_TO_TIMELINE_CHANNEL, async (event, arg: IAddMediaToTimelineChannel) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) {
				console.error(`Group ${arg.groupId} not found.`)
				return
			}

			const rundown = findRundown(group, arg.rundownId)
			if (!rundown) {
				console.error('Could not find rundown ' + arg.rundownId)
				return
			}

			const media = findMedia(this._appDataRef.media, arg.filename)
			if (!media) return

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

			this.updateRundown(rundown)
			this._updateViewRef()
		})

		ipcMain.on(ADD_TEMPLATE_TO_TIMELINE_CHANNEL, async (event, arg: IAddTemplateToTimelineChannel) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) {
				console.error(`Group ${arg.groupId} not found.`)
				return
			}

			const rundown = findRundown(group, arg.rundownId)
			if (!rundown) return

			const template = findTemplate(this._appDataRef.templates, arg.filename)
			if (!template) return

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

			this.updateRundown(rundown)
			this._updateViewRef()
		})

		ipcMain.on(TOGGLE_GROUP_LOOP_CHANNEL, async (event, arg: IToggleGroupLoop) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) return

			group.loop = arg.value

			this._updateViewRef()
		})
		ipcMain.on(TOGGLE_GROUP_AUTOPLAY_CHANNEL, async (event, arg: IToggleAutoPlayLoop) => {
			const group = findGroup(this._appDataRef, arg.groupId)
			if (!group) return

			group.autoPlay = arg.value

			this._updateViewRef()
		})
	}

	updateRundown(rundown: RundownModel) {
		const resolvedTimeline = Resolver.resolveTimeline(rundown.timeline, { time: 0 })
		let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)

		rundown.resolved = {
			duration: maxDuration,
		}
	}

	updateTimeline(group: GroupModel) {
		group.playheadData = updateTimeline(this.updateTimelineCache, this._appDataRef, group)
	}
}
