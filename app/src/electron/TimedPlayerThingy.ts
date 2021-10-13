import { APP_FEED_CHANNEL, PLAY_RUNDOWN_CHANNEL } from '@/ipc/channels'
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
		}, 5000)

		this.init()
		this.resolve()
	}

	init() {
		ipcMain.on(PLAY_RUNDOWN_CHANNEL, (event, arg) => {
			TsrBridgeApi.postTimeline(arg)
		})
	}

	resolve() {
		const options = {
			time: 0,
		}
		// const resolvedTimeline = Timeline.Resolver.resolveTimeline(rundownsMock[0].timeline, options)
		// console.log(JSON.stringify(resolvedTimeline))
		// const resolvedStates = Timeline.Resolver.resolveAllStates(resolvedTimeline)
		// console.log(JSON.stringify(resolvedStates))
	}

	updateView() {
		console.log('Updating view')
		this.mainWindow.webContents.send(APP_FEED_CHANNEL, appMock)
	}
}
