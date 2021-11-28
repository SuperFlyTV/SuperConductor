import { BrowserWindow, ipcMain } from 'electron'
import { appMock } from '@/mocks/appMock'
import { TPTCasparCG } from './TPTCasparCG'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { GroupModel } from '@/models/GroupModel'
import { IPCServer } from './IPCServer'
import { IPCClient } from './IPCClient'
import { updateTimeline, UpdateTimelineCache } from './timeline'
import { GroupPreparedPlayheadData } from '@/models/PlayheadData'

export class TimedPlayerThingy {
	appData = appMock

	mainWindow?: BrowserWindow
	ipcServer?: IPCServer
	ipcClient?: IPCClient
	tptCaspar?: TPTCasparCG

	windowPosition: WindowPosition = {
		y: undefined,
		x: undefined,
		width: 1200,
		height: 600,
	}

	constructor() {
		this.loadAppData()
	}

	initWindow(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow

		this.ipcServer = new IPCServer(ipcMain, this.appData, {
			updateViewRef: () => {
				this.updateView()
			},
			refreshMediaRef: () => {
				this.tptCaspar?.fetchAndSetMedia()
			},
			refreshTemplatesRef: () => {
				this.tptCaspar?.fetchAndSetTemplates()
			},
			updateTimeline: (cache: UpdateTimelineCache, group: GroupModel): GroupPreparedPlayheadData | null => {
				return updateTimeline(cache, this.appData, group)
			},
		})
		this.ipcClient = new IPCClient(this.mainWindow)
		this.tptCaspar = new TPTCasparCG(this.appData, this.updateView.bind(this))
	}

	updateView() {
		this.ipcClient?.appFeed(this.appData)

		this.saveAppData()
	}

	private getTptDir() {
		const homeDirPath = os.homedir()
		return path.join(homeDirPath, 'Documents', 'Timed-Player-Thingy')
	}
	private getAppDataPath(): string {
		return path.join(this.getTptDir(), 'appData.json')
	}

	loadAppData() {
		try {
			const read = fs.readFileSync(this.getAppDataPath())

			const storedData = JSON.parse(read.toString()) as Storage

			if (storedData) {
				if (storedData.groups) this.appData.groups = storedData.groups
				if (storedData.windowPosition) this.windowPosition = storedData.windowPosition
			}
		} catch (error) {
			console.log(`No file found.`)
		}
	}

	saveAppData() {
		const tptDirPath = this.getTptDir()

		try {
			if (!fs.existsSync(tptDirPath)) {
				fs.mkdirSync(tptDirPath)
			}

			const store: Storage = {
				groups: this.appData.groups,
				windowPosition: this.windowPosition,
			}

			fs.writeFileSync(this.getAppDataPath(), JSON.stringify(store), 'utf-8')
		} catch (e) {
			alert('Failed to save the file!')
		}
	}
}

interface Storage {
	groups: GroupModel[]
	windowPosition: WindowPosition
}
type WindowPosition =
	| {
			y: number
			x: number
			width: number
			height: number
	  }
	| {
			// Note: undefined will center the window
			y: undefined
			x: undefined
			width: number
			height: number
	  }
