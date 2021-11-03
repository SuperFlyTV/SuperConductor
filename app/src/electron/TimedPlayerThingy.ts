import { BrowserWindow, ipcMain } from 'electron'
import short from 'short-uuid'
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
} from '@/ipc/channels'
import { deleteRundown, deleteTimelineObj, findMedia, findRundown, findTemplate, findTimelineObj } from '@/lib/util'
import { appMock } from '@/mocks/appMock'
import { TsrBridgeApi } from './api/TsrBridge'
import { DeviceType, TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'

export class TimedPlayerThingy {
	mainWindow: BrowserWindow
	appData = appMock

	constructor(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow

		this.updateView()
		setInterval(() => {
			this.updateView()
		}, 2000)

		this.init()
	}

	init() {
		ipcMain.on(PLAY_RUNDOWN_CHANNEL, async (event, arg) => {
			try {
				const res = await TsrBridgeApi.playTimeline({
					id: 'myId',
					groupId: 'myGroupId',
					newTimeline: arg,
					newMappings: this.appData.mappings,
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
			this.appData.selectedTimelineObjId = arg
			this.updateView()
		})

		ipcMain.on(UPDATE_TIMELINE_OBJ_CHANNEL, async (event, arg: IUpdateTimelineObj) => {
			const found = findTimelineObj(this.appData.rundowns, arg.id)
			if (!found) return
			;(found.enable as any).start = arg.enableStart
			;(found.enable as any).duration = arg.enableDuration
			found.layer = arg.layer
			this.updateView()
		})

		ipcMain.on(NEW_RUNDOWN_CHANNEL, async (event, arg: INewRundown) => {
			this.appData.rundowns.push({
				id: short.generate(),
				name: arg.name,
				type: 'rundown',
				timeline: [],
			})
			this.updateView()
		})

		ipcMain.on(DELETE_RUNDOWN_CHANNEL, async (event, arg: IDeleteRundown) => {
			this.appData.rundowns = deleteRundown(this.appData.rundowns, arg.id)
			this.updateView()
		})

		ipcMain.on(UPDATE_TEMPLATE_DATA_CHANNEL, async (event, arg: IUpdateTemplateDataChannel) => {
			const found = findTimelineObj(this.appData.rundowns, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found as any).content.data)

			if (arg.changedItemId === 'key') {
				// Delete old key and create new
				const oldValue = data[arg.key]
				delete data[arg.key]
				data[arg.value] = oldValue
			} else {
				// Just change value
				console.log('Just change value')
				data[arg.key] = arg.value
			}

			;(found as any).content.data = JSON.stringify(data)
			this.updateView()
		})

		ipcMain.on(NEW_TEMPLATE_DATA_CHANNEL, async (event, arg: INewTemplateDataChannel) => {
			const found = findTimelineObj(this.appData.rundowns, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found as any).content.data)
			data[''] = ''
			;(found as any).content.data = JSON.stringify(data)

			this.updateView()
		})

		ipcMain.on(DELETE_TEMPLATE_DATA_CHANNEL, async (event, arg: IDeleteTemplateDataChannel) => {
			const found = findTimelineObj(this.appData.rundowns, arg.timelineObjId)
			if (!found) return

			const data = JSON.parse((found as any).content.data)
			delete data[arg.key]
			;(found as any).content.data = JSON.stringify(data)

			this.updateView()
		})

		ipcMain.on(DELETE_TIMELINE_OBJ_CHANNEL, async (event, arg: IDeleteTimelineObjChannel) => {
			deleteTimelineObj(this.appData.rundowns, arg.timelineObjId)

			this.updateView()
		})

		ipcMain.on(ADD_MEDIA_TO_TIMELINE_CHANNEL, async (event, arg: IAddMediaToTimelineChannel) => {
			const rd = findRundown(this.appData.rundowns, arg.rundownId)
			if (!rd) return

			const media = findMedia(this.appData.media, arg.filename)
			if (!media) return

			// if (media.type === 'MOVIE') {
			// } else if (media.type === 'STILL') {
			// } else if (media.type === 'AUDIO') {
			// }

			const data: TSRTimelineObj = {
				id: short.generate(),
				layer: arg.layerId,
				enable: {
					start: 0,
					duration: 5 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: arg.filename,
				},
			}

			rd.timeline.push(data)

			this.updateView()
		})

		ipcMain.on(ADD_TEMPLATE_TO_TIMELINE_CHANNEL, async (event, arg: IAddTemplateToTimelineChannel) => {
			const rd = findRundown(this.appData.rundowns, arg.rundownId)
			if (!rd) return

			const template = findTemplate(this.appData.templates, arg.filename)
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

			this.updateView()
		})
	}

	updateView() {
		console.log('Updating view')
		this.mainWindow.webContents.send(APP_FEED_CHANNEL, this.appData)
	}
}
