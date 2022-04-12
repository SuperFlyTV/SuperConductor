import { KeyDisplay, KeyDisplayTimeline, PeripheralInfo } from '@shared/api'
import { WebsocketConnection, WebsocketServer } from '@shared/server-lib'
import { BridgeAPI } from '@shared/api'
import { Project } from '../models/project/Project'
import { Bridge, INTERNAL_BRIDGE_ID } from '../models/project/Bridge'
import { SessionHandler } from './sessionHandler'
import { StorageHandler } from './storageHandler'
import { assertNever } from '@shared/lib'
import _ from 'lodash'
import { Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { ResourceAny } from '@shared/models'
import { BaseBridge } from '@shared/tsr-bridge'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { version: CURRENT_VERSION }: { version: string } = require('../../package.json')
export const SERVER_PORT = 5400

type AnyBridgeConnection = WebsocketBridgeConnection | LocalBridgeConnection

/** This handles connected bridges */
export class BridgeHandler {
	server: WebsocketServer

	private outgoingBridges: {
		[bridgeId: string]: {
			bridge: Bridge
			connection: WebsocketConnection
		}
	} = {}
	private internalBridge: LocalBridgeConnection | null = null
	private connectedBridges: Array<AnyBridgeConnection> = []
	private mappings: Mappings = {}
	private timelines: { [timelineId: string]: TSRTimeline } = {}
	private settings: { [bridgeId: string]: Bridge['settings'] } = {}
	private closed = false

	constructor(
		private session: SessionHandler,
		private storage: StorageHandler,
		private callbacks: BridgeConnectionCallbacks
	) {
		this.server = new WebsocketServer(SERVER_PORT, (connection: WebsocketConnection) => {
			// On connection:

			const bridge = new WebsocketBridgeConnection(this.session, this.storage, connection, this.callbacks)

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
			console.error('Server closed')
		})

		this.storage.on('project', (project: Project) => {
			this.onUpdatedProject(project)
		})
	}
	getBridgeConnection(bridgeId: string): AnyBridgeConnection | undefined {
		return this.connectedBridges.find((b) => b.bridgeId === bridgeId)
	}
	async onClose() {
		if (this.internalBridge) {
			await this.internalBridge.destroy()
		}
		this.closed = true
	}
	onUpdatedProject(project: Project) {
		if (this.closed) return
		if (project.settings.enableInternalBridge) {
			if (!this.internalBridge) {
				this.internalBridge = new LocalBridgeConnection(this.session, this.storage, this.callbacks)
				this.connectedBridges.push(this.internalBridge)
			}
		} else {
			if (this.internalBridge) {
				this.session.updateBridgeStatus(INTERNAL_BRIDGE_ID, null)
				const bridgeIndex = this.connectedBridges.findIndex(
					(connectedBridge) => connectedBridge === this.internalBridge
				)
				if (bridgeIndex >= 0) {
					this.connectedBridges.splice(bridgeIndex, 1)
				}
				const internalBridge = this.internalBridge
				this.internalBridge = null
				internalBridge.destroy().catch(console.error)
			}
		}

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
					// Set an initial status
					this.session.updateBridgeStatus(bridge.id, {
						connected: false,
						devices: {},
					})

					// Guard against invalid addresses entered by the user
					try {
						const connection: WebsocketConnection = this.server.connectToServer(bridge.url)
						// connection.id = bridge.id
						connection.on('close', () => {
							// 'close' means that it's really gone.
							// remove bridge:
							delete this.outgoingBridges[bridge.id]
						})
						this.outgoingBridges[bridge.id] = {
							bridge,
							connection,
						}
					} catch (error) {
						console.error(`Failed to create a websocket connection to "${bridge.url}"`)
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

interface BridgeConnectionCallbacks {
	updatedResources: (deviceId: string, resources: ResourceAny[]) => void
	onVersionMismatch: (bridgeId: string, bridgeVersion: string, ourVersion: string) => void
	onDeviceRefreshStatus: (deviceId: string, refreshing: boolean) => void
}

abstract class AbstractBridgeConnection {
	public bridgeId: string | null = null

	private sentSettings: Bridge['settings'] | null = null
	private sentMappings: any | null = null
	private sentTimelines: { [timelineId: string]: TSRTimeline } = {}

	constructor(
		protected session: SessionHandler,
		protected storage: StorageHandler,
		protected callbacks: BridgeConnectionCallbacks
	) {}

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
	peripheralSetKeyDisplay(deviceId: string, identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline) {
		this.send({
			type: 'peripheralSetKeyDisplay',
			deviceId,
			identifier,
			keyDisplay,
		})
	}

	getTimelineIds() {
		// Request a list of the current timelineIds from the Bridge.
		// The bridge will reply with its timelineIds, and we'll pipe them into this._syncTimelineIds()
		this.send({ type: 'getTimelineIds' })
	}
	protected getCurrentTime() {
		return Date.now()
	}
	protected _syncTimelineIds(bridgeTimelineIds: string[]) {
		// Sync the timelineIds reported from the bridge with our own:
		for (const timelineId of bridgeTimelineIds) {
			if (!this.sentTimelines) {
				this.removeTimeline(timelineId)
			}
		}
	}
	protected onInit(id: string, version: string) {
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
			console.error(`Error: Settings bridge "${this.bridgeId}" not found`)
		}
		if (this.sentMappings) {
			this.setMappings(this.sentMappings, true)
		}
		for (const [timelineId, timeline] of Object.entries(this.sentTimelines)) {
			this.addTimeline(timelineId, timeline)
		}
		// Sync timelineIds:
		this.getTimelineIds()
		this.session.resetPeripheralTriggerStatuses(this.bridgeId)
	}
	protected onInitRequestId() {
		if (!this.bridgeId) throw new Error('onInitRequestId: bridgeId not set')
		this.send({ type: 'setId', id: this.bridgeId })
	}
	protected onDeviceStatus(deviceId: string, ok: boolean, message: string) {
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

		if (existing.connectionId !== this.getConnectionId()) {
			updated = true
			existing.connectionId = this.getConnectionId()
		}

		if (updated) {
			this.session.updateBridgeStatus(this.bridgeId, bridgeStatus)
			this.refreshResources()
		}
	}
	protected onDeviceRemoved(deviceId: string) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')

		const bridgeStatus = this.session.getBridgeStatus(this.bridgeId)
		if (!bridgeStatus) throw new Error('onDeviceStatus: bridgeStatus not set')

		delete bridgeStatus.devices[deviceId]

		this.callbacks.updatedResources(deviceId, [])
		this.session.updateBridgeStatus(this.bridgeId, bridgeStatus)
	}
	protected _onPeripheralStatus(deviceId: string, info: PeripheralInfo, status: 'connected' | 'disconnected') {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')
		this.session.updatePeripheralStatus(this.bridgeId, deviceId, info, status === 'connected')
	}
	protected _onPeripheralTrigger(deviceId: string, trigger: 'keyDown' | 'keyUp', identifier: string) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')
		this.session.updatePeripheralTriggerStatus(this.bridgeId, deviceId, identifier, trigger === 'keyDown')
	}
	protected handleMessage(msg: BridgeAPI.FromBridge.Any) {
		if (msg.type === 'initRequestId') {
			if (this.onInitRequestId) this.onInitRequestId()
		} else if (msg.type === 'init') {
			this.onInit(msg.id, msg.version)
		} else if (msg.type === 'status') {
			// todo
		} else if (msg.type === 'deviceStatus') {
			if (this.onDeviceStatus) this.onDeviceStatus(msg.deviceId, msg.ok, msg.message)
		} else if (msg.type === 'deviceRemoved') {
			this.onDeviceRemoved(msg.deviceId)
		} else if (msg.type === 'updatedResources') {
			this.callbacks.updatedResources(msg.deviceId, msg.resources)
		} else if (msg.type === 'timelineIds') {
			this._syncTimelineIds(msg.timelineIds)
		} else if (msg.type === 'PeripheralStatus') {
			this._onPeripheralStatus(msg.deviceId, msg.info, msg.status)
		} else if (msg.type === 'PeripheralTrigger') {
			this._onPeripheralTrigger(msg.deviceId, msg.trigger, msg.identifier)
		} else if (msg.type === 'DeviceRefreshStatus') {
			this.callbacks.onDeviceRefreshStatus(msg.deviceId, msg.refreshing)
		} else {
			assertNever(msg)
		}
	}
	protected createBridgeInProjectIfNotExists() {
		if (!this.bridgeId) {
			return
		}

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
	protected abstract send(msg: BridgeAPI.FromTPT.Any): void
	protected abstract getConnectionId(): number
}

export class WebsocketBridgeConnection extends AbstractBridgeConnection {
	constructor(
		session: SessionHandler,
		storage: StorageHandler,
		private connection: WebsocketConnection,
		callbacks: BridgeConnectionCallbacks
	) {
		super(session, storage, callbacks)
		const setConnected = () => {
			if (this.bridgeId) {
				this.createBridgeInProjectIfNotExists()
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
		this.connection.on('message', this.handleMessage.bind(this))
	}
	protected send(msg: BridgeAPI.FromTPT.Any) {
		if (this.connection.connected) {
			this.connection.send(msg)
		}
	}
	protected getConnectionId(): number {
		return this.connection.connectionId
	}
}

export class LocalBridgeConnection extends AbstractBridgeConnection {
	private baseBridge: BaseBridge
	private connectionId: number = Date.now() + Math.random()

	constructor(session: SessionHandler, storage: StorageHandler, callbacks: BridgeConnectionCallbacks) {
		super(session, storage, callbacks)
		this.bridgeId = INTERNAL_BRIDGE_ID
		this.baseBridge = new BaseBridge(this.handleMessage.bind(this), console)
		this.createBridgeInProjectIfNotExists()
		this.send({
			type: 'setId',
			id: INTERNAL_BRIDGE_ID,
		})
	}
	async destroy(): Promise<void> {
		await this.baseBridge.destroy()
	}
	protected send(msg: BridgeAPI.FromTPT.Any) {
		try {
			this.baseBridge.handleMessage(msg)
		} catch (err) {
			console.error(err)
		}
	}
	protected getConnectionId(): number {
		return this.connectionId
	}
}
