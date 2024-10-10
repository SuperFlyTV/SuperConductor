import { BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { AutoFillMode, Group } from '../models/rundown/Group'
import { EverythingService } from './EverythingService'
import { ClientEventBus } from './ClientEventBus'
import { updateTimeline } from './timeline'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { StorageHandler } from './storageHandler'
import { AppData } from '../models/App/AppData'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import {
	ResourceAny,
	ResourceId,
	unprotectString,
	MetadataAny,
	SerializedProtectedMap,
	TSRDeviceId,
	serializeProtectedMap,
} from '@shared/models'
import { BridgeHandler, CURRENT_VERSION } from './bridgeHandler'
import _ from 'lodash'
import { BridgeStatus } from '../models/project/Bridge'
import { PeripheralStatus } from '../models/project/Peripheral'
import { TriggersHandler } from './triggersHandler'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { BridgeId, LoggerLike } from '@shared/api'
import { hash, listAvailableDeviceIDs, rateLimitIgnore, updateGroupPlayingParts } from '../lib/util'
import { findAutoFillResources } from '../lib/autoFill'
import { Part } from '../models/rundown/Part'
import { getDefaultPart } from '../lib/defaults'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { postProcessPart } from './rundown'
import { BridgePeripheralId, assertNever } from '@shared/lib'
import { TelemetryHandler } from './telemetry'
import { USER_AGREEMENT_VERSION } from '../lib/userAgreement'
import { ApiServer } from './api/ApiServer'
import { ActiveAnalog } from '../models/rundown/Analog'
import { AnalogHandler } from './analogHandler'
import { AnalogInput } from '../models/project/AnalogInput'
import { SystemMessageOptions } from '../ipc/IPCAPI'
import { getTimelineForGroup } from '../lib/timeline'
import { TSRTimeline } from 'timeline-state-resolver-types'
import { UndoLedgerService } from './UndoService'

export class SuperConductor {
	ipcServer: EverythingService
	windows: { window: BrowserWindow }[] = []
	clientEventBus: ClientEventBus
	httpAPI?: ApiServer

	session: SessionHandler
	storage: StorageHandler
	telemetryHandler: TelemetryHandler
	triggers: TriggersHandler
	analogHandler: AnalogHandler
	bridgeHandler: BridgeHandler

	private shuttingDown = false
	private resourceUpdatesToSend = new Map<ResourceId, ResourceAny | null>()
	private metadataUpdatesToSend = new Map<TSRDeviceId, MetadataAny | null>()
	private __triggerBatchSendResourcesAndMetadataTimeout: NodeJS.Timeout | null = null
	private autoRefreshInterval: {
		interval: number
		timer: NodeJS.Timer
	} | null = null
	private refreshStatus = new Map<TSRDeviceId, number>()

	private hasStoredStartupUserStatistics = false

	private internalHttpApiPort = 5500
	private disableInternalHttpApi = false

	constructor(private log: LoggerLike, private renderLog: LoggerLike) {
		this.session = new SessionHandler()
		this.clientEventBus = new ClientEventBus()

		this.session.on('bridgeStatus', (id: BridgeId, status: BridgeStatus | null) => {
			this.clientEventBus.updateBridgeStatus(id, status)
		})
		this.session.on('peripheral', (peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null) => {
			this.triggers.onPeripheralStatus(peripheralId, peripheral)
			this.clientEventBus.updatePeripheral(peripheralId, peripheral)
		})
		this.session.on('activeTriggers', (activeTriggers: ActiveTriggers) => {
			this.triggers?.updateActiveTriggers(activeTriggers)
			this.clientEventBus.updatePeripheralTriggers(activeTriggers)
		})
		this.session.on('activeAnalog', (fullIdentifier: string, analog: ActiveAnalog | null) => {
			this.analogHandler?.updateActiveAnalog(fullIdentifier, analog)
			this.clientEventBus.updatePeripheralAnalog(fullIdentifier, analog)
		})
		this.session.on('definingArea', (definingArea: DefiningArea | null) => {
			this.triggers?.updateDefiningArea(definingArea)
			this.clientEventBus.updateDefiningArea(definingArea)
		})
		this.session.on('allTrigger', (fullIdentifier: string, trigger: ActiveTrigger | null) => {
			this.triggers?.registerTrigger(fullIdentifier, trigger)
		})
		this.session.on('selection', () => {
			this.triggers?.triggerUpdatePeripherals()
		})

		this.storage = new StorageHandler(log, CURRENT_VERSION)
		this.storage.on('appData', (appData: AppData) => {
			this.clientEventBus.updateAppData(appData)
			this.triggers.registerGlobalKeyboardTriggers()
		})
		this.storage.on('project', (project: Project) => {
			this.clientEventBus.updateProject(project)
			this.handleAutoRefresh()
		})
		this.storage.on('rundown', (fileName: string, rundown: Rundown) => {
			this.clientEventBus.updateRundown(fileName, rundown)
			this.triggers.registerGlobalKeyboardTriggers()
		})
		this.storage.on('resource', (id: ResourceId, resource: ResourceAny | null) => {
			// Add the resource to the list of resources to send to the client in batches later:
			this.resourceUpdatesToSend.set(id, resource)
			this._triggerBatchSendResourcesAndMetadata()
			this.triggerHandleAutoFill()
		})
		this.storage.on('metadata', (id: TSRDeviceId, metadata: MetadataAny | null) => {
			// Add the metadata to the list of metadatas to send to the client in batches later:
			this.metadataUpdatesToSend.set(id, metadata)
			this._triggerBatchSendResourcesAndMetadata()
			this.triggerHandleAutoFill()
		})
		this.storage.on('analogInput', (fullIdentifier: string, analogInput: AnalogInput | null) => {
			this.clientEventBus.updateAnalogInput(fullIdentifier, analogInput)
			this.bridgeHandler.updateAnalogInput(analogInput)
		})

		this.telemetryHandler = new TelemetryHandler(this.log, this.storage)

		process.argv.forEach((value, index) => {
			if (value === '--disable-telemetry') {
				this.log.info('Telemetry disabled')
				this.telemetryHandler.disableTelemetry()
			} else if (value === '--disable-internal-http-api') {
				this.disableInternalHttpApi = true
			} else if (value === '--internal-http-api-port') {
				this.internalHttpApiPort = parseInt(process.argv[index + 1], 10)
			}
		})

		const appData = this.storage.getAppData()
		if (appData.userAgreement === USER_AGREEMENT_VERSION) {
			// The user has previously agreed to the user agreement
			this.telemetryHandler.setUserHasAgreed()

			if (!this.hasStoredStartupUserStatistics) {
				this.hasStoredStartupUserStatistics = true
				this.telemetryHandler.onStartup()
			}
		}

		// Set up handlers for exceptions, to be reported
		process.on('uncaughtException', (err, origin) => {
			this.telemetryHandler.onError(`Uncaught exception: ${err}`, `Origin: ${origin}`)
			this.log.error(`Uncaught exception: ${err} \nOrigin: ${origin}`)
		})
		process.on('unhandledRejection', (reason: any, promise: any) => {
			this.telemetryHandler.onError(`Unhandled rejection: ${reason}`, `at ${promise}`)
			this.log.error(`Unhandled rejection: ${reason} \nat ${promise}`)
		})
		process.on('warning', (warning) => {
			this.telemetryHandler.onError(`Warning: ${warning.name}: ${warning.message}`, warning.stack)
			this.log.warn(`Warning: ${warning.name}: ${warning.message} \nStack: ${warning.stack}`)
		})

		this.bridgeHandler = new BridgeHandler(this.log, this.session, this.storage, {
			updatedResourcesAndMetadata: (
				deviceId: TSRDeviceId,
				resources: ResourceAny[],
				metadata: MetadataAny | null
			): void => {
				if (this.shuttingDown) return

				// Resources
				{
					// Added/Updated:
					const newResouceIds = new Set<ResourceId>()
					for (const resource of resources) {
						newResouceIds.add(resource.id)
						if (!_.isEqual(this.storage.getResource(resource.id), resource)) {
							this.storage.updateResource(resource.id, resource)
						}
					}
					// Removed:
					for (const id of this.storage.getResourceIds(deviceId)) {
						if (!newResouceIds.has(id)) this.storage.updateResource(id, null)
					}
				}

				// Metadata
				{
					// Added, updated, or removed:
					if (!_.isEqual(this.storage.getMetadata(deviceId), metadata)) {
						this.storage.updateMetadata(deviceId, metadata)
					}
				}
			},
			onVersionMismatch: (bridgeId: BridgeId, bridgeVersion: string, ourVersion: string): void => {
				this.windows.forEach((client) => {
					dialog
						.showMessageBox(client.window, {
							type: 'warning',
							title: 'Bridge version mismatch',
							message: `The connected bridge "${bridgeId}" is of a different version than SuperConductor.
							\nBridge version: v${bridgeVersion}
							SuperConductor version: v${ourVersion}
							\nThis is likely to result in errors and unexpected behavior. Please ensure that both SuperConductor and tsr-bridge are up-to-date.`,
						})
						.catch(this.log.error)
				})
			},
			onDeviceRefreshStatus: (deviceId, refreshing) => {
				if (this.shuttingDown) return
				if (refreshing) {
					this.refreshStatus.set(deviceId, Date.now())
				} else {
					this.refreshStatus.delete(deviceId)
				}
				this.clientEventBus.updateDeviceRefreshStatus(deviceId, refreshing)
			},
		})

		const undoLedgerService = new UndoLedgerService(this.log)
		undoLedgerService.on('updatedUndoLedger', (data) => {
			this.clientEventBus.updateUndoLedgers(data)
		})

		this.ipcServer = new EverythingService(
			this.log,
			this.renderLog,
			this.storage,
			this,
			this.session,
			undoLedgerService,
			{
				refreshResources: () => {
					this.refreshResources()
				},
				refreshResourcesSetAuto: (interval: number) => {
					const project = this.storage.getProject()
					project.autoRefreshInterval = interval
					this.storage.updateProject(project)
				},
				onClientConnected: () => {
					// Nothing here yet
				},
				installUpdate: () => {
					autoUpdater.autoRunAppAfterInstall = true
					autoUpdater.quitAndInstall()
				},
				updateTimeline: (group: Group): GroupPreparedPlayData | null => {
					return this.updateTimeline(group)
				},
				updatePeripherals: (): void => {
					this.triggers?.triggerUpdatePeripherals()
					this.analogHandler?.triggerUpdatePeripherals()
				},
				setKeyboardKeys: (activeKeys: ActiveTrigger[]): void => {
					this.triggers?.setKeyboardKeys(activeKeys)
				},
				triggerHandleAutoFill: () => {
					this.triggerHandleAutoFill()
				},
				makeDevData: async () => {
					await this.storage.makeDevData()
				},
				onAgreeToUserAgreement: () => {
					this.telemetryHandler.setUserHasAgreed()
					this.telemetryHandler.onAcceptUserAgreement()

					if (!this.hasStoredStartupUserStatistics) {
						this.hasStoredStartupUserStatistics = true
						this.telemetryHandler.onStartup()
					}
				},
				handleError: (error: string, stack?: string) => {
					this.log.error(error, stack)
					this.telemetryHandler.onError(error, stack)
				},
			}
		)

		this.triggers = new TriggersHandler(this.log, this.storage, this.ipcServer, this.bridgeHandler, this.session)
		this.triggers.on('error', (e) => this.log.error(e))
		this.triggers.on('failedGlobalTriggers', (failedGlobalTriggers) => {
			this.clientEventBus.updateFailedGlobalTriggers(Array.from(failedGlobalTriggers))
		})
		this.ipcServer.triggers = this.triggers

		this.analogHandler = new AnalogHandler(this.storage, this.bridgeHandler)
		this.analogHandler.on('error', (e) => this.log.error(e))

		// TODO: this also serves the contents of the Electron window - it cannot be disabled
		// if (this.disableInternalHttpApi) {
		// 	this.log.info(`Internal HTTP API disabled`)
		// } else {
		this.httpAPI = new ApiServer(this.internalHttpApiPort, this.ipcServer, this.clientEventBus, this.log)
		// }

		this._restoreTimelines()
	}
	sendSystemMessage(message: string, options: SystemMessageOptions): void {
		this.clientEventBus.systemMessage(message, options)
	}
	public setAutoUpdateAllowPrerelease(forceCheckUpdates: boolean): void {
		const appData = this.storage.getAppData()

		const preReleaseAutoUpdate = appData.preReleaseAutoUpdate ?? appData.version.currentVersionIsPrerelease

		autoUpdater.autoDownload = true
		autoUpdater.allowDowngrade = true

		if (autoUpdater.allowPrerelease !== preReleaseAutoUpdate || forceCheckUpdates) {
			autoUpdater.allowPrerelease = preReleaseAutoUpdate

			setTimeout(() => {
				autoUpdater.checkForUpdatesAndNotify().catch(this.log.error)
			}, 1000)
		}
	}
	private _triggerBatchSendResourcesAndMetadata() {
		// Send updates of resources and metadata in batches to the client.
		// This is done to improve performance,
		// it turns out that sending a large amount of messages is slowly received by the client.
		if (!this.__triggerBatchSendResourcesAndMetadataTimeout) {
			this.__triggerBatchSendResourcesAndMetadataTimeout = setTimeout(() => {
				this.__triggerBatchSendResourcesAndMetadataTimeout = null

				const resourceUpdatesToSend: { id: ResourceId; resource: ResourceAny | null }[] = []
				for (const [id, resource] of this.resourceUpdatesToSend.entries()) {
					resourceUpdatesToSend.push({ id, resource })
				}

				const metadataUpdatesToSend: SerializedProtectedMap<TSRDeviceId, MetadataAny | null> =
					serializeProtectedMap(this.metadataUpdatesToSend)

				if (resourceUpdatesToSend.length || Object.keys(metadataUpdatesToSend).length) {
					this.clientEventBus.updateResourcesAndMetadata(resourceUpdatesToSend, metadataUpdatesToSend)
				}
				this.resourceUpdatesToSend.clear()
			}, 100)
		}
	}
	private handleAutoRefresh() {
		const project = this.storage.getProject()
		const interval = project.autoRefreshInterval

		if (this.autoRefreshInterval && this.autoRefreshInterval.interval !== interval) {
			clearInterval(this.autoRefreshInterval.timer)
			this.autoRefreshInterval = null
		}

		if (interval && !this.autoRefreshInterval) {
			this.autoRefreshInterval = {
				interval,
				timer: setInterval(() => {
					if (this.autoRefreshInterval && this.shuttingDown) {
						clearInterval(this.autoRefreshInterval?.timer)
						this.autoRefreshInterval = null
					} else {
						let anyRefreshing = false
						for (const refreshTime of this.refreshStatus.values()) {
							if (Date.now() - refreshTime < 10000) {
								anyRefreshing = true
								break
							}
						}
						if (!anyRefreshing) {
							this.refreshResources()
						} else {
							// Wait for refresh to finish, do nothing..
						}
					}
				}, project.autoRefreshInterval),
			}
		}
	}
	private triggerHandleAutoFill = rateLimitIgnore(() => this.handleAutoFill(), 100)
	private handleAutoFill() {
		const project = this.storage.getProject()
		let added = 0
		let removed = 0

		for (const rundown of this.storage.getAllRundowns()) {
			let rundownHasChanged = false
			for (const group of rundown.groups) {
				let groupHasChanged = false
				if (group.autoFill.enable) {
					const resources = findAutoFillResources(project, group.autoFill, this.storage.getResources())

					if (group.autoFill.mode === AutoFillMode.REPLACE) {
						const removedParts: Part[] = []
						let j = -1
						for (const r of resources) {
							const partId = `${group.id}_af_${hash(unprotectString(r.resource.id))}`

							// Try to find a matching part
							let foundPart: Part | undefined = undefined
							while (j < group.parts.length) {
								j++
								const part = group.parts[j]
								if (!part) break

								if (part.id === partId) {
									foundPart = part
									break
								} else if (part.autoFilled) {
									// huh, it's an autofilled part, but not ours.
									// Remove it:

									removedParts.push(...group.parts.splice(j, 1))
									removed++
									j--
									groupHasChanged = true
								} else {
									// Not our part, leave it be
								}
							}

							if (!foundPart) {
								let newPart: Part

								// See if the part was recently removed:
								const reInsertPart = removedParts.find((p) => p.id === partId)
								if (reInsertPart) {
									// Re-use the part:
									newPart = reInsertPart
								} else {
									// Add a new part to the group:
									newPart = {
										...getDefaultPart(),
										id: partId,
										name: r.resource.displayName,
										autoFilled: true,
									}

									const timelineObj: TimelineObj = {
										obj: r.obj,
										resolved: { instances: [] }, // set later
									}
									timelineObj.obj.layer = r.layerId
									newPart.timeline.push(timelineObj)
									postProcessPart(newPart)
								}

								group.parts.push(newPart)
								added++
								groupHasChanged = true
								j++
							}
						}

						// Remove residual auto-filled parts:
						while (j < group.parts.length) {
							j++
							const part = group.parts[j]
							if (!part) break

							if (part.autoFilled) {
								// it's an autofilled part, but not ours.
								// Remove it:
								removedParts.push(...group.parts.splice(j, 1))
								removed++
								j--
								groupHasChanged = true
							}
						}
					} else if (group.autoFill.mode === AutoFillMode.APPEND) {
						for (const r of resources) {
							const partId = `${group.id}_af_${hash(unprotectString(r.resource.id))}`

							const foundPart = group.parts.find((p) => p.id === partId)
							if (!foundPart) {
								// Add a new part to the group:
								const newPart: Part = {
									...getDefaultPart(),
									id: partId,
									name: r.resource.displayName,
									autoFilled: true,
								}

								const timelineObj: TimelineObj = {
									obj: r.obj,
									resolved: { instances: [] }, // set later
								}
								timelineObj.obj.layer = r.layerId

								newPart.timeline.push(timelineObj)
								postProcessPart(newPart)

								group.parts.push(newPart)
								added++
								groupHasChanged = true
							}
						}
					} else {
						assertNever(group.autoFill.mode)
					}
				}
				if (groupHasChanged) {
					rundownHasChanged = true
					// Update Timeline:
					group.preparedPlayData = this.updateTimeline(group)
					updateGroupPlayingParts(group)
				}
			}
			if (rundownHasChanged) {
				this.storage.updateRundown(rundown.id, rundown)
			}
		}
		if (added || removed) {
			this.triggers?.triggerUpdatePeripherals()
		}
	}

	onNewWindow(window: BrowserWindow): {
		close: () => void
	} {
		const client = {
			window,
		}

		this.windows.push(client)

		return {
			close: () => {
				const index = this.windows.findIndex((c) => c === client)
				if (index >= 0) this.windows.splice(index)
			},
		}
	}
	private refreshResources(): void {
		// Remove resources of devices we don't have anymore:
		const project = this.storage.getProject()
		const deviceIds = listAvailableDeviceIDs(project.bridges)
		for (const [id, resource] of this.storage.getResources().entries()) {
			if (!deviceIds.has(resource.deviceId)) {
				this.storage.updateResource(id, null)
			}
		}

		this.bridgeHandler?.refreshResources()
	}

	private updateTimeline(group: Group): GroupPreparedPlayData | null {
		if (!this.bridgeHandler) throw new Error('Internal Error: No bridgeHandler set')

		return updateTimeline(this.storage, this.bridgeHandler, group)
	}
	private _restoreTimelines() {
		const project = this.storage.getProject()

		const openRundowns = this.storage.getAllRundowns()

		for (const openRundown of openRundowns) {
			for (const group of openRundown.groups) {
				const timeline = getTimelineForGroup(group, group.preparedPlayData, undefined) as TSRTimeline
				this.bridgeHandler.updateTimeline(group.id, timeline)
			}
		}

		this.bridgeHandler.updateMappings(project.mappings)
	}

	/**
	 * Is called when the app is starting to shut down.
	 * After this has been called, the client window has closed.
	 */
	isShuttingDown(): void {
		this.shuttingDown = true
		this.session.terminate()
	}
	/**
	 * Is called when the app is shutting down.
	 * Shut down everything
	 */
	terminate(): void {
		this.storage.terminate()
		this.triggerHandleAutoFill.clear()
	}
}
