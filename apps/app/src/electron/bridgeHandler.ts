import { WebsocketConnection, WebsocketServer } from '@shared/api'
import { BridgeAPI } from '@shared/api'
import { Project } from '../models/project/Project'
import { Bridge } from '../models/project/Bridge'
import { SessionHandler } from './sessionHandler'
import { StorageHandler } from './storageHandler'
import { assertNever } from '@shared/lib'
import _ from 'lodash'
import { Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { ResourceAny } from '@shared/models'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { version: CURRENT_VERSION }: { version: string } = require('../../package.json')
export const SERVER_PORT = 5400

/** This handles connected bridges */
export class BridgeHandler {
	server: WebsocketServer

	private outgoingBridges: {
		[bridgeId: string]: {
			bridge: Bridge
			connection: WebsocketConnection
		}
	} = {}
	private connectedBridges: BridgeConnection[] = []
	private mappings: Mappings = {}
	private timelines: { [timelineId: string]: TSRTimeline } = {}
	private settings: { [bridgeId: string]: Bridge['settings'] } = {}

	constructor(
		private session: SessionHandler,
		private storage: StorageHandler,
		private callbacks: {
			updatedResources: (deviceId: string, resources: ResourceAny[]) => void
			onVersionMismatch: (bridgeId: string, bridgeVersion: string, ourVersion: string) => void
		}
	) {
		this.server = new WebsocketServer(SERVER_PORT, (connection: WebsocketConnection) => {
			// On connection:

			const bridge = new BridgeConnection(this, this.session, this.storage, connection, {
				updatedResources: (deviceId: string, resources: ResourceAny[]) => {
					this.callbacks.updatedResources(deviceId, resources)
				},
				onVersionMismatch: (bridgeId: string, bridgeVersion: string, ourVersion: string) => {
					this.callbacks.onVersionMismatch(bridgeId, bridgeVersion, ourVersion)
				},
			})

			// Lookup and set the bridgeId, if it is an outgoing
			for (const [bridgeId, outgoing] of Object.entries(this.outgoingBridges)) {
				if (outgoing.connection.connectionId === connection.connectionId) {
					bridge.bridgeId = bridgeId
				}
			}

			this.connectedBridges.push(bridge)
		})

		this.server.on('close', () => {
			// todo: handle server close?
			console.log('Server closed')
		})

		this.storage.on('project', (project: Project) => {
			this.onUpdatedProject(project)
		})
	}

	onUpdatedProject(project: Project) {
		// Added/updated:
		for (const bridge of Object.values(project.bridges)) {
			if (bridge.outgoing) {
				const existing = this.outgoingBridges[bridge.id]
				let addNew = false
				if (!existing) {
					// Added
					addNew = true
				} else if (existing.bridge.url !== bridge.url) {
					// Updated

					existing.connection.terminate()
					addNew = true
				}

				if (addNew) {
					const connection: WebsocketConnection = this.server.connectToServer(bridge.url)
					// connection.id = bridge.id

					connection.on('close', () => {
						// 'close' means that it's really gone.
						// remove bridge:
						delete this.outgoingBridges[bridge.id]
					})
					console.log('Connecting to bridge', bridge.id, connection.connectionId)
					this.outgoingBridges[bridge.id] = {
						bridge,
						connection,
					}
				}
			}

			this.updateSettings(bridge.id, bridge.settings)
		}
		// Removed
		for (const bridgeId of Object.keys(this.outgoingBridges)) {
			const existing = this.outgoingBridges[bridgeId]

			if (existing && !project.bridges[bridgeId]) {
				// removed:
				existing.connection.terminate()
			}
		}
	}
	updateMappings(mappings: Mappings) {
		if (!_.isEqual(this.mappings, mappings)) {
			this.mappings = mappings

			for (const bridgeConnection of this.connectedBridges) {
				bridgeConnection.setMappings(mappings)
			}
		}
	}
	updateTimeline(timelineId: string, timeline: TSRTimeline | null) {
		if (!_.isEqual(this.timelines[timelineId], timeline)) {
			if (timeline) {
				this.timelines[timelineId] = timeline

				for (const bridgeConnection of this.connectedBridges) {
					bridgeConnection.addTimeline(timelineId, timeline)
				}
			} else {
				delete this.timelines[timelineId]

				for (const bridgeConnection of this.connectedBridges) {
					bridgeConnection.removeTimeline(timelineId)
				}
			}
		}
	}
	updateSettings(bridgeId: string, settings: Bridge['settings']) {
		const bridgeConnection = this.connectedBridges.find((bc) => bc.bridgeId === bridgeId)
		if (bridgeConnection) {
			bridgeConnection.setSettings(settings)
		}
	}
	refreshResources() {
		for (const bridgeConnection of this.connectedBridges) {
			bridgeConnection.refreshResources()
		}
	}
}

export class BridgeConnection {
	public bridgeId: string | null = null

	private sentSettings: Bridge['settings'] | null = null
	private sentMappings: any | null = null
	private sentTimelines: { [timelineId: string]: TSRTimeline } = {}

	constructor(
		private parent: BridgeHandler,
		private session: SessionHandler,
		private storage: StorageHandler,
		private connection: WebsocketConnection,
		private callbacks: {
			updatedResources: (deviceId: string, resources: ResourceAny[]) => void
			onVersionMismatch: (bridgeId: string, bridgeVersion: string, ourVersion: string) => void
		}
	) {
		const setConnected = () => {
			if (this.bridgeId) {
				const project = this.storage.getProject()

				// If the bridge doesn't exist in settings, create it:
				if (!project.bridges[this.bridgeId]) {
					project.bridges[this.bridgeId] = {
						id: this.bridgeId,
						name: this.bridgeId,
						outgoing: false,
						url: '',
						settings: {
							devices: {},
						},
					}
					this.storage.updateProject(project)
				}

				// Update the connection status:
				let status = this.session.getBridgeStatus(this.bridgeId)
				if (!status) {
					status = {
						connected: false,
						devices: {},
					}
				}
				status.connected = true

				this.session.updateBridgeStatus(this.bridgeId, status)
			}
		}
		this.connection.on('connected', () => {
			setConnected()
		})
		this.connection.on('disconnected', () => {
			if (this.bridgeId) {
				const status = this.session.getBridgeStatus(this.bridgeId)
				if (status) {
					status.connected = false
					this.session.updateBridgeStatus(this.bridgeId, status)
				}
			}
		})
		this.connection.on('message', (msg: BridgeAPI.FromBridge.Any) => {
			if (msg.type === 'initRequestId') {
				this.onInitRequestId()
			} else if (msg.type === 'init') {
				this.onInit(msg.id, msg.version)
			} else if (msg.type === 'status') {
				// todo
			} else if (msg.type === 'deviceStatus') {
				this.onDeviceStatus(msg.deviceId, msg.ok, msg.message)
			} else if (msg.type === 'updatedResources') {
				this.callbacks.updatedResources(msg.deviceId, msg.resources)
			} else if (msg.type === 'timelineIds') {
				this._syncTimelineIds(msg.timelineIds)
			} else {
				assertNever(msg)
			}
		})
	}
	setSettings(settings: Bridge['settings'], force = false) {
		if (force || !_.isEqual(this.sentSettings, settings)) {
			this.sentSettings = settings
			this.send({ type: 'setSettings', ...settings })
		}
	}
	addTimeline(timelineId: string, timeline: TSRTimeline) {
		this.sentTimelines[timelineId] = timeline
		this.send({ type: 'addTimeline', timelineId, timeline, currentTime: this.getCurrentTime() })
	}
	removeTimeline(timelineId: string) {
		delete this.sentTimelines[timelineId]
		this.send({ type: 'removeTimeline', timelineId, currentTime: this.getCurrentTime() })
	}
	setMappings(mappings: Mappings, force = false) {
		if (force || !_.isEqual(this.sentMappings, mappings)) {
			this.sentMappings = mappings
			this.send({ type: 'setMappings', mappings, currentTime: this.getCurrentTime() })
		}
	}
	refreshResources() {
		this.send({ type: 'refreshResources' })
	}

	getTimelineIds() {
		// Request a list of the current timelineIds from the Bridge.
		// The bridge will reply with its timelineIds, and we'll pipe them into this._syncTimelineIds()
		this.send({ type: 'getTimelineIds' })
	}
	private getCurrentTime() {
		return Date.now()
	}
	private _syncTimelineIds(bridgeTimelineIds: string[]) {
		// Sync the timelineIds reported from the bridge with our own:
		for (const timelineId of bridgeTimelineIds) {
			if (!this.sentTimelines) {
				this.removeTimeline(timelineId)
			}
		}
	}
	private send(msg: BridgeAPI.FromTPT.Any) {
		if (this.connection.connected) {
			this.connection.send(msg)
		} else {
			console.log('not sending, because not connected', msg.type)
		}
	}

	private onInit(id: string, version: string) {
		if (!this.bridgeId) {
			this.bridgeId = id
		} else if (this.bridgeId !== id) {
			throw new Error(`bridgeId ID mismatch: "${this.bridgeId}" vs "${id}"`)
		}

		if (version !== CURRENT_VERSION) {
			this.callbacks.onVersionMismatch(id, version, CURRENT_VERSION)
		}

		// Send initial commands:
		const project = this.storage.getProject()
		const bridge = project.bridges[this.bridgeId]
		if (bridge) {
			this.setSettings(bridge.settings, true)
		} else {
			console.log(`Error: Settings bridge "${this.bridgeId}" not found`)
		}
		if (this.sentMappings) {
			this.setMappings(this.sentMappings, true)
		}
		for (const [timelineId, timeline] of Object.entries(this.sentTimelines)) {
			this.addTimeline(timelineId, timeline)
		}
		// Sync timelineIds:
		this.getTimelineIds()
	}
	private onInitRequestId() {
		if (!this.bridgeId) throw new Error('onInitRequestId: bridgeId not set')
		this.send({ type: 'setId', id: this.bridgeId })
	}
	private onDeviceStatus(deviceId: string, ok: boolean, message: string) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')

		const bridgeStatus = this.session.getBridgeStatus(this.bridgeId)
		if (!bridgeStatus) throw new Error('onDeviceStatus: bridgeStatus not set')

		if (!bridgeStatus.devices[deviceId]) {
			bridgeStatus.devices[deviceId] = {
				connectionId: 0,
				message: '',
				ok: false,
			}
		}
		let updated = false
		const existing = bridgeStatus.devices[deviceId]
		if (existing.ok !== ok || existing.message !== message) {
			updated = true

			existing.ok = ok
			existing.message = message
		}

		if (existing.connectionId !== this.connection.connectionId) {
			updated = true
			existing.connectionId = this.connection.connectionId
			// There is a new connection, we should trigger a refresh of resources:
			this.refreshResources()
		}

		if (updated) {
			this.session.updateBridgeStatus(this.bridgeId, bridgeStatus)
		}
	}
}
