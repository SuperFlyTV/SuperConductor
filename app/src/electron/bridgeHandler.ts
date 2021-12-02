import { WebsocketConnection, WebsocketServer } from './api/WebsocketServer'
import { BridgeAPI } from './api/bridgeAPI'
import { Project } from '@/models/project/Project'
import { Bridge } from '@/models/project/Bridge'
import { SessionHandler } from './sessionHandler'
import { StorageHandler } from './storageHandler'
import { assertNever } from '@/lib/lib'
import _ from 'lodash'
import { DeviceOptionsAny, Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { ResourceAny } from '@/models/resource/resource'

const SERVER_PORT = 5400

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
		}
	) {
		this.server = new WebsocketServer(SERVER_PORT, (connection: WebsocketConnection) => {
			// On connection:

			const bridge = new BridgeConnection(this, this.session, this.storage, connection, {
				updatedResources: (deviceId: string, resources: ResourceAny[]) => {
					this.callbacks.updatedResources(deviceId, resources)
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
	updateSettings(bridgeId: string, settings: Bridge['settings'], force = false) {
		for (const bridgeConnection of this.connectedBridges) {
			if (bridgeConnection.bridgeId === bridgeId) {
				if (!_.isEqual(bridgeConnection.sentSettings, settings) || force) {
					bridgeConnection.sentSettings = settings
					bridgeConnection.setSettings(settings.devices)
				}

				break
			}
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

	public sentSettings: Bridge['settings'] | null = null

	constructor(
		private parent: BridgeHandler,
		private session: SessionHandler,
		private storage: StorageHandler,
		private connection: WebsocketConnection,
		private callbacks: {
			updatedResources: (deviceId: string, resources: ResourceAny[]) => void
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
				this.onInit(msg.id)
			} else if (msg.type === 'status') {
				// todo
			} else if (msg.type === 'deviceStatus') {
				this.onDeviceStatus(msg.deviceId, msg.ok, msg.message)
			} else if (msg.type === 'updatedResources') {
				this.callbacks.updatedResources(msg.deviceId, msg.resources)
			} else {
				assertNever(msg)
			}
		})
	}
	setSettings(devices: { [deviceId: string]: DeviceOptionsAny }) {
		this.send({ type: 'setSettings', devices })
	}
	addTimeline(timelineId: string, timeline: TSRTimeline) {
		this.send({ type: 'addTimeline', timelineId, timeline })
	}
	removeTimeline(timelineId: string) {
		this.send({ type: 'removeTimeline', timelineId })
	}
	setMappings(mappings: Mappings) {
		this.send({ type: 'setMappings', mappings })
	}
	refreshResources() {
		this.send({ type: 'refreshResources' })
	}
	private send(msg: BridgeAPI.FromTPT.Any) {
		if (this.connection.connected) {
			this.connection.send(msg)
		} else {
			console.log('not sending, because not connected', msg.type)
		}
	}

	private onInit(id: string) {
		if (!this.bridgeId) {
			this.bridgeId = id
		} else if (this.bridgeId !== id) {
			throw new Error(`bridgeId ID mismatch: "${this.bridgeId}" vs "${id}"`)
		}

		// Send initial commands:
		const project = this.storage.getProject()
		const bridge = project.bridges[this.bridgeId]
		if (bridge) {
			this.parent.updateSettings(this.bridgeId, bridge.settings, true)
		} else {
			console.log(`Error: settings bridge "${this.bridgeId}" not found`)
		}
		// this.parent.onUpdatedProject(project)

		// this.setSettings

		// this.refreshResources()
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
