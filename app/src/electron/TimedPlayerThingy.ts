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

		this.saveAppData()
	}

	private getTptDir() {
		const homeDirPath = os.homedir()
		return path.join(homeDirPath, 'Documents', 'Timed-Player-Thingy')
	}
	private getAppDataPath(): string {
		return path.join(this.getTptDir(), 'appData.json')
	}

	handleOnOpen() {
		try {
			const read = fs.readFileSync(this.getAppDataPath())
			const data = read.toString()

			this.appData.groups = JSON.parse(data)
		} catch (error) {
			console.log('No rundowns.json found.')
		}
	}

	saveAppData() {
		const tptDirPath = this.getTptDir()

		try {
			if (!fs.existsSync(tptDirPath)) {
				fs.mkdirSync(tptDirPath)
			}

			fs.writeFileSync(this.getAppDataPath(), JSON.stringify(this.appData.groups), 'utf-8')
		} catch (e) {
			alert('Failed to save the file!')
		}
	}
}
