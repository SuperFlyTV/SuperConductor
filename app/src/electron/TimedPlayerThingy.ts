import { BrowserWindow } from 'electron'
import { APP_FEED_CHANNEL } from '@/ipc/channels'
import { appMock } from '@/mocks/appMock'
import { TPTCasparCG } from './TPTCasparCG'
import { IPCPostman } from './IPCPostman'
import fs from 'fs'
import os from 'os'
import path from 'path'

export class TimedPlayerThingy {
	mainWindow: BrowserWindow
	appData = appMock
	ipcPostman: IPCPostman
	tptCaspar: TPTCasparCG

	constructor(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow

		this.ipcPostman = new IPCPostman(
			this.appData,
			this.updateView.bind(this),
			() => {
				this.tptCaspar.fetchAndSetMedia()
			},
			() => {
				this.tptCaspar.fetchAndSetTemplates()
			}
		)
		this.tptCaspar = new TPTCasparCG(this.appData, this.updateView.bind(this))

		this.handleOnOpen()
	}

	updateView() {
		this.mainWindow.webContents.send(APP_FEED_CHANNEL, this.appData)
	}

	private getTptDir() {
		const homeDirPath = os.homedir()
		return path.join(homeDirPath, 'Documents', 'Timed Player Thingy')
	}

	handleOnOpen() {
		const tptDirPath = this.getTptDir()

		try {
			const read = fs.readFileSync(path.join(tptDirPath, 'rundowns.json'))
			const data = read.toString()

			this.appData.rundowns = JSON.parse(data)
		} catch (error) {
			console.log('No rundowns.json found.')
		}
	}

	handleOnClose() {
		const tptDirPath = this.getTptDir()

		try {
			if (!fs.existsSync(tptDirPath)) {
				fs.mkdirSync(tptDirPath)
			}

			fs.writeFileSync(path.join(tptDirPath, 'rundowns.json'), JSON.stringify(this.appData.rundowns), 'utf-8')
		} catch (e) {
			alert('Failed to save the file!')
		}
	}
}
