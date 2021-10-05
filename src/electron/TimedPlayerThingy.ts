import { BrowserWindow } from 'electron'
import { DeviceType, MappingCasparCG } from 'timeline-state-resolver'
import { literal } from 'timeline-state-resolver/dist/devices/device'

export class TimedPlayerThingy {
	mainWindow: BrowserWindow

	// mappings = {
	// 	casparLayer0: literal<MappingCasparCG>({
	// 		device: DeviceType.CASPARCG,
	// 		deviceId: 'caspar0',
	// 		channel: 1,
	// 		layer: 10,
	// 	}),
	// }

	myTimeline = [
		{
			id: 'video0',
			layer: 'L1',
			enable: {
				start: 10,
				end: 100,
			},
			content: {},
		},
		{
			id: 'graphic0',
			layer: 'L2',
			enable: {
				start: 15,
				duration: 10,
			},
			content: {},
			classes: ['graphics'],
		},
	]

	constructor(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow
	}

	updateView() {
		this.mainWindow.webContents.send('TEST', { abc: 'def' })
	}
}
