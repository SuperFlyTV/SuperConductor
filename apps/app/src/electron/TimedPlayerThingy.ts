import { BrowserWindow, dialog, ipcMain } from 'electron'
import winston from 'winston'
import { Group } from '../models/rundown/Group'
import { IPCServer } from './IPCServer'
import { IPCClient } from './IPCClient'
import { updateTimeline, UpdateTimelineCache } from './timeline'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { AppData } from '../models/App/AppData'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import { ResourceAny } from '@shared/models'
import { BridgeHandler, CURRENT_VERSION } from './bridgeHandler'
import _ from 'lodash'
import { BridgeStatus } from '../models/project/Bridge'
import { PeripheralStatus } from '../models/project/Peripheral'
import { TriggersHandler } from './triggersHandler'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { DefiningArea } from '../lib/triggers/keyDisplay'

export class TimedPlayerThingy {
	mainWindow?: BrowserWindow
	ipcServer?: IPCServer
	ipcClient?: IPCClient

	session: SessionHandler
	storage: StorageHandler
	triggers?: TriggersHandler
	bridgeHandler?: BridgeHandler

	private resourceUpdatesToSend: Array<{ id: string; resource: ResourceAny | null }> = []
	private __triggerBatchSendResourcesTimeout: NodeJS.Timeout | null = null

	constructor(private log: winston.Logger, private renderLog: winston.Logger) {
		this.session = new SessionHandler()
		this.storage = new StorageHandler(
			log,
			{
				// Default window position:
				y: undefined,
				x: undefined,
				width: 1200,
				height: 600,
				maximized: false,
			},
			CURRENT_VERSION
		)

		this.session.on('resource', (id: string, resource: ResourceAny | null) => {
			// Add the resource to the list of resources to send to the client in batches later:
			this.resourceUpdatesToSend.push({ id, resource })
			this._triggerBatchSendResources()
		})
		this.session.on('bridgeStatus', (id: string, status: BridgeStatus | null) => {
			this.ipcClient?.updateBridgeStatus(id, status)
		})
		this.session.on('peripheral', (peripheralId: string, peripheral: PeripheralStatus | null) => {
			this.ipcClient?.updatePeripheral(peripheralId, peripheral)
		})
		this.session.on('activeTriggers', (activeTriggers: ActiveTriggers) => {
			this.triggers?.updateActiveTriggers(activeTriggers)
			this.ipcClient?.updatePeripheralTriggers(activeTriggers)
		})
		this.session.on('definingArea', (definingArea: DefiningArea | null) => {
			this.triggers?.updateDefiningArea(definingArea)
			this.ipcClient?.updateDefiningArea(definingArea)
		})
		this.session.on('allTrigger', (fullIdentifier: string, trigger: ActiveTrigger | null) => {
			this.triggers?.registerTrigger(fullIdentifier, trigger)
		})
		this.storage.on('appData', (appData: AppData) => {
			this.ipcClient?.updateAppData(appData)
		})
		this.storage.on('project', (project: Project) => {
			this.ipcClient?.updateProject(project)
		})
		this.storage.on('rundown', (fileName: string, rundown: Rundown) => {
			this.ipcClient?.updateRundown(fileName, rundown)
		})
	}
	private _triggerBatchSendResources() {
		// Send updates of resources in batches to the client.
		// This is done to improve performance,
		// it turns out that sending a large amount of messages is slowly received by the client.
		if (!this.__triggerBatchSendResourcesTimeout) {
			this.__triggerBatchSendResourcesTimeout = setTimeout(() => {
				this.__triggerBatchSendResourcesTimeout = null
				this.ipcClient?.updateResources(this.resourceUpdatesToSend)
				this.resourceUpdatesToSend = []
			}, 100)
		}
	}

	initWindow(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow

		const bridgeHandler = new BridgeHandler(this.log, this.session, this.storage, {
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
			onVersionMismatch: (bridgeId: string, bridgeVersion: string, ourVersion: string): void => {
				dialog
					.showMessageBox(mainWindow, {
						type: 'warning',
						title: 'Bridge version mismatch',
						message: `The connected bridge "${bridgeId}" is of a different version than SuperConductor.
						\nBridge version: v${bridgeVersion}
						SuperConductor version: v${ourVersion}
						\nThis is likely to result in errors and unexpected behavior. Please ensure that both SuperConductor and tsr-bridge are up-to-date.`,
					})
					.catch(this.log.error)
			},
			onDeviceRefreshStatus: (deviceId, refreshing) => {
				this.ipcClient?.updateDeviceRefreshStatus(deviceId, refreshing)
			},
		})
		this.bridgeHandler = bridgeHandler

		this.ipcServer = new IPCServer(ipcMain, this.log, this.renderLog, this.storage, this.session, {
			refreshResources: () => {
				// this.tptCaspar?.fetchAndSetMedia()
				// this.tptCaspar?.fetchAndSetTemplates()
				bridgeHandler.refreshResources()
			},
			updateTimeline: (cache: UpdateTimelineCache, group: Group): GroupPreparedPlayData | null => {
				return updateTimeline(cache, this.storage, bridgeHandler, group)
			},
			updatePeripherals: (): void => {
				this.triggers?.triggerUpdatePeripherals()
			},
			setKeyboardKeys: (activeKeys: ActiveTrigger[]): void => {
				this.triggers?.setKeyboardKeys(activeKeys)
			},
		})
		this.ipcClient = new IPCClient(this.mainWindow)
		this.triggers = new TriggersHandler(this.log, this.storage, this.ipcServer, this.bridgeHandler)
	}

	terminate() {
		this.session.terminate()
		this.storage.terminate()
	}
}
