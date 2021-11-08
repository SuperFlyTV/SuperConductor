import { ipcMain } from 'electron'
import short from 'short-uuid'
import { TsrBridgeApi } from './api/TsrBridge'
import { DeviceType, TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'

import {
	APP_FEED_CHANNEL,
	PLAY_RUNDOWN_CHANNEL,
	SELECT_TIMELINE_OBJ_CHANNEL,
	STOP_RUNDOWN_CHANNEL,
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
} from '@/ipc/channels'

import {
	deleteGroup,
	deleteRundown,
	deleteTimelineObj,
	findGroup,
	findMedia,
	findParentGroup,
	findRundown,
	findTemplate,
	findTimelineObj,
	getResolvedTimelineTotalDuration,
} from '@/lib/util'
import { AppModel, RundownOrGroupModel } from '@/models/AppModel'
import { Resolver } from 'superfly-timeline'

export class IPCPostman {
	private _appDataRef: AppModel
	private _updateViewRef: () => void
	private _refreshMediaRef: () => void
	private _refreshTemplatesRef: () => void

	constructor(
		appData: AppModel,
		updateViewRef: () => void,
		refreshMediaRef: () => void,
		refreshTemplatesRef: () => void
	) {
		this._appDataRef = appData
		this._updateViewRef = updateViewRef
		this._refreshMediaRef = refreshMediaRef
		this._refreshTemplatesRef = refreshTemplatesRef

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
			const rundownId = arg.rundownId

			const rd = findRundown(this._appDataRef.rundowns, rundownId)
			if (!rd) {
				console.error(`Rundown ${rundownId} not found.`)
				return
			}

			let timelineToPlay: TSRTimelineObj[] = []

			const group = findParentGroup(this._appDataRef.rundowns, rundownId)
			if (group && group.loop) {
				// Set up looping group
				const resolvedTimeline = Resolver.resolveTimeline(rd.timeline, { time: 0 })
				let maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline)
				timelineToPlay = [
					{
						id: 'Group0',
						enable: {
							start: Date.now(),
							duration: maxDuration,
							repeating: maxDuration,
						},
						layer: '',
						content: {
							deviceType: DeviceType.ABSTRACT,
							type: 'empty',
						},
						isGroup: true,
						children: rd.timeline,
					},
				]
			} else {
				// Set up normal group
				timelineToPlay = [
					{
						id: rundownId,
						enable: {
							start: Date.now(),
						},
						layer: '',
						content: {
							deviceType: DeviceType.ABSTRACT,
							type: 'empty',
						},
						isGroup: true,
						children: rd.timeline,
					},
				]
			}

			try {
				const res = await TsrBridgeApi.playTimeline({
					id: 'myId',
					groupId: 'myGroupId',
					newTimeline: timelineToPlay,
					newMappings: this._appDataRef.mappings,
				})
				const startedTime = res.data
				event.returnValue = startedTime
			} catch (error) {
				event.returnValue = false
			}
		})

		ipcMain.on(STOP_RUNDOWN_CHANNEL, async (event, arg) => {
			await TsrBridgeApi.stopTimeline({ id: 'myId' })
		})

		ipcMain.on(SELECT_TIMELINE_OBJ_CHANNEL, async (event, arg) => {
			this._appDataRef.selectedTimelineObjId = arg
			this._updateViewRef()
		})

		ipcMain.on(UPDATE_TIMELINE_OBJ_CHANNEL, async (event, arg: IUpdateTimelineObj) => {
			const found = findTimelineObj(this._appDataRef.rundowns, arg.id)
			if (!found) return
			;(found.enable as any).start = arg.enableStart
			;(found.enable as any).duration = arg.enableDuration
			found.layer = arg.layer
			this._updateViewRef()
		})

		ipcMain.on(NEW_RUNDOWN_CHANNEL, async (event, arg: INewRundown) => {
			const newItem: RundownOrGroupModel = {
				id: short.generate(),
				name: arg.name,
				type: 'rundown',
				timeline: [],
			}

			if (arg.groupId) {
				const group = findGroup(this._appDataRef.rundowns, arg.groupId)
				if (!group) {
					console.error(`Group ${arg.groupId} not found.`)
					return
				}
				group.rundowns.push(newItem)
			} else {
				this._appDataRef.rundowns.push(newItem)
			}
			this._updateViewRef()
		})

		ipcMain.on(NEW_GROUP_CHANNEL, async (event, arg: INewRundown) => {
			const newItem: RundownOrGroupModel = {
				id: short.generate(),
				name: arg.name,
				type: 'group',
				rundowns: [],
				loop: false,
			}

			if (arg.groupId) {
				const group = findGroup(this._appDataRef.rundowns, arg.groupId)
				if (!group) {
					console.error(`Group ${arg.groupId} not found.`)
					return
				}
				group.rundowns.push(newItem)
			} else {
				this._appDataRef.rundowns.push(newItem)
			}
			this._updateViewRef()
		})

		ipcMain.on(DELETE_RUNDOWN_CHANNEL, async (event, arg: IDeleteRundown) => {
			this._appDataRef.rundowns = deleteRundown(this._appDataRef.rundowns, arg.id)
			this._updateViewRef()
		})

		ipcMain.on(DELETE_GROUP_CHANNEL, async (event, arg: IDeleteGroup) => {
			this._appDataRef.rundowns = deleteGroup(this._appDataRef.rundowns, arg.groupId)
			this._updateViewRef()
		})

		/**
		 * TODO - fix changing order
		 */
		ipcMain.on(UPDATE_TEMPLATE_DATA_CHANNEL, async (event, arg: IUpdateTemplateDataChannel) => {
			const found = findTimelineObj(this._appDataRef.rundowns, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found as any).content.data)

			if (arg.changedItemId === 'key') {
				// Delete old key and create new
				const oldValue = data[arg.key]
				delete data[arg.key]
				data[arg.value] = oldValue
			} else {
				// Just change value
				data[arg.key] = arg.value
			}

			;(found as any).content.data = JSON.stringify(data)
			this._updateViewRef()
		})

		ipcMain.on(NEW_TEMPLATE_DATA_CHANNEL, async (event, arg: INewTemplateDataChannel) => {
			const found = findTimelineObj(this._appDataRef.rundowns, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found as any).content.data)
			data[''] = ''
			;(found as any).content.data = JSON.stringify(data)

			this._updateViewRef()
		})

		ipcMain.on(DELETE_TEMPLATE_DATA_CHANNEL, async (event, arg: IDeleteTemplateDataChannel) => {
			const found = findTimelineObj(this._appDataRef.rundowns, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found as any).content.data)
			delete data[arg.key]
			;(found as any).content.data = JSON.stringify(data)

			this._updateViewRef()
		})

		ipcMain.on(DELETE_TIMELINE_OBJ_CHANNEL, async (event, arg: IDeleteTimelineObjChannel) => {
			deleteTimelineObj(this._appDataRef.rundowns, arg.timelineObjId)

			this._updateViewRef()
		})

		ipcMain.on(ADD_MEDIA_TO_TIMELINE_CHANNEL, async (event, arg: IAddMediaToTimelineChannel) => {
			const rd = findRundown(this._appDataRef.rundowns, arg.rundownId)
			if (!rd) {
				console.error('Could not find rundown ' + arg.rundownId)
				return
			}

			const media = findMedia(this._appDataRef.media, arg.filename)
			if (!media) return

			let duration = 5000
			if (media.type === 'video') {
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

			rd.timeline.push(data)

			this._updateViewRef()
		})

		ipcMain.on(ADD_TEMPLATE_TO_TIMELINE_CHANNEL, async (event, arg: IAddTemplateToTimelineChannel) => {
			const rd = findRundown(this._appDataRef.rundowns, arg.rundownId)
			if (!rd) return

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

			rd.timeline.push(data)

			this._updateViewRef()
		})

		ipcMain.on(TOGGLE_GROUP_LOOP_CHANNEL, async (event, arg: IToggleGroupLoop) => {
			const foundGroup = findGroup(this._appDataRef.rundowns, arg.groupId)
			if (!foundGroup) return

			foundGroup.loop = arg.value

			this._updateViewRef()
		})
	}
}
