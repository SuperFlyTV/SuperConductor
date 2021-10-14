import { APP_FEED_CHANNEL, PLAY_RUNDOWN_CHANNEL, STOP_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { appMock } from '@/mocks/appMock'
import { BrowserWindow, ipcMain } from 'electron'
import Timeline from 'superfly-timeline'
import { TsrBridgeApi } from './api/TsrBridge'
// const Timeline = require('superfly-timeline')

export class TimedPlayerThingy {
	mainWindow: BrowserWindow

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
	}

	updateView() {
		console.log('Updating view')
		this.mainWindow.webContents.send(APP_FEED_CHANNEL, appMock)
	}
}
