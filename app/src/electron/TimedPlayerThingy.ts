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
} from '@/ipc/channels'
import { findTimelineObj } from '@/lib/util'
import { appMock } from '@/mocks/appMock'
import { BrowserWindow, ipcMain } from 'electron'
import Timeline from 'superfly-timeline'
import short from 'short-uuid'

import { TsrBridgeApi } from './api/TsrBridge'
// const Timeline = require('superfly-timeline')

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
			const res = await TsrBridgeApi.playTimeline({ id: 'myId', groupId: 'myGroupId', newTimeline: arg })
			const startedTime = res.data
			event.returnValue = startedTime
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
	}

	updateView() {
		console.log('Updating view')
		this.mainWindow.webContents.send(APP_FEED_CHANNEL, this.appData)
	}
}
