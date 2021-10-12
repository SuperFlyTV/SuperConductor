import { MAIN_CHANNEL } from '@/ipc/channels'
import { appMock } from '@/mocks/appMock'
import { rundownsMock } from '@/mocks/rundownsMock'
import { BrowserWindow } from 'electron'
import Timeline from 'superfly-timeline'

export class TimedPlayerThingy {
	mainWindow: BrowserWindow

	constructor(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow

		this.updateView()
		setInterval(() => {
			this.updateView()
		}, 5000)

		this.resolve()
	}

	resolve() {
		const options = {
			time: 0,
		}
		// const resolvedTimeline = Timeline.Resolver.resolveTimeline(rundownsMock[0].timeline, options)
		// const resolvedStates = Timeline.Resolver.resolveAllStates(resolvedTimeline)
	}

	updateView() {
		console.log('Updating view')
		this.mainWindow.webContents.send(MAIN_CHANNEL, appMock)
	}
}
