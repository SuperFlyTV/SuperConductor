import { BrowserWindow, ipcMain } from 'electron'
import { Group } from '../models/rundown/Group'
import { IPCServer } from './IPCServer'
import { IPCClient } from './IPCClient'
import { updateTimeline, UpdateTimelineCache } from './timeline'
import { GroupPreparedPlayheadData } from '../models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { AppData } from '../models/App/AppData'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import { ResourceAny } from '../models/resource/resource'
import { BridgeHandler } from './bridgeHandler'
import _ from 'lodash'
import { BridgeStatus } from '../models/project/Bridge'

export class TimedPlayerThingy {
	mainWindow?: BrowserWindow
	ipcServer?: IPCServer
	ipcClient?: IPCClient
	// tptCaspar?: TPTCasparCG

	session: SessionHandler
	storage: StorageHandler
	bridgeHandler: BridgeHandler

	constructor() {
		this.session = new SessionHandler()
		this.storage = new StorageHandler({
			// Default window position:
			y: undefined,
			x: undefined,
			width: 1200,
			height: 600,
		})
		this.bridgeHandler = new BridgeHandler(this.session, this.storage, {
			updatedResources: (deviceId: string, resources: ResourceAny[]): void => {
				// Added/Updated:
				const newResouceIds = new Set<string>()
				for (const resource of resources) {
					newResouceIds.add(resource.id)
					if (!_.isEqual(this.session.getResource(resource.id), resource)) {
						this.session.updateResource(resource.id, resource)
					}
				}
				// Removed:
				for (const id of this.session.getResourceIds(deviceId)) {
					if (!newResouceIds.has(id)) this.session.updateResource(id, null)
				}
			},
		})

		this.session.on('resource', (id: string, resource: ResourceAny | null) => {
			this.ipcClient?.updateResource(id, resource)
		})
		this.session.on('bridgeStatus', (id: string, status: BridgeStatus | null) => {
			this.ipcClient?.updateBridgeStatus(id, status)
		})
		this.storage.on('appData', (_appData: AppData) => {
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
				this.bridgeHandler.refreshResources()
			},
			updateTimeline: (cache: UpdateTimelineCache, group: Group): GroupPreparedPlayheadData | null => {
				return updateTimeline(cache, this.storage, this.bridgeHandler, group)
			},
		})
		this.ipcClient = new IPCClient(this.mainWindow)
		// this.tptCaspar = new TPTCasparCG(this.session)
	}
}
