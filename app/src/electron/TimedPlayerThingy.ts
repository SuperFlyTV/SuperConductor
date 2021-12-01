import { BrowserWindow, ipcMain } from 'electron'
import { Group } from '@/models/rundown/Group'
import { IPCServer } from './IPCServer'
import { IPCClient } from './IPCClient'
import { updateTimeline, UpdateTimelineCache } from './timeline'
import { GroupPreparedPlayheadData } from '@/models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { AppData } from '@/models/App/AppData'
import { Project } from '@/models/project/Project'
import { Rundown } from '@/models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import { ResourceAny } from '@/models/resource/resource'

export class TimedPlayerThingy {
	mainWindow?: BrowserWindow
	ipcServer?: IPCServer
	ipcClient?: IPCClient
	// tptCaspar?: TPTCasparCG

	session: SessionHandler
	storage: StorageHandler

	constructor() {
		this.session = new SessionHandler()
		this.storage = new StorageHandler({
			// Default window position:
			y: undefined,
			x: undefined,
			width: 1200,
			height: 600,
		})

		this.session.on('resource', (id: string, resource: ResourceAny | null) => {
			this.ipcClient?.updateResource(id, resource)
		})
		this.storage.on('appData', (appData: AppData) => {
			// todo?
		})
		this.storage.on('project', (project: Project) => {
			this.ipcClient?.updateProject(project)
		})
		this.storage.on('rundown', (fileName: string, rundown: Rundown) => {
			this.ipcClient?.updateRundown(fileName, rundown)
		})
	}

	initWindow(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow

		this.ipcServer = new IPCServer(ipcMain, this.storage, this.session, {
			refreshResources: () => {
				// this.tptCaspar?.fetchAndSetMedia()
				// this.tptCaspar?.fetchAndSetTemplates()
			},
			updateTimeline: (cache: UpdateTimelineCache, group: Group): GroupPreparedPlayheadData | null => {
				return updateTimeline(cache, this.storage, group)
			},
		})
		this.ipcClient = new IPCClient(this.mainWindow)
		// this.tptCaspar = new TPTCasparCG(this.session)
	}
}
