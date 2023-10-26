import {
	KeyDisplay,
	KeyDisplayTimeline,
	PeripheralInfo,
	BridgeAPI,
	LoggerLike,
	KnownPeripheral,
	AnalogValue,
	PeripheralId,
	BridgeId,
	PeripheralSettingsBase,
} from '@shared/api'
import { WebsocketConnection, WebsocketServer } from '@shared/server-lib'
import { AnalogInputSetting, Project } from '../models/project/Project'
import { Bridge, BridgeDevice, INTERNAL_BRIDGE_ID } from '../models/project/Bridge'
import { SessionHandler } from './sessionHandler'
import { StorageHandler } from './storageHandler'
import { assertNever } from '@shared/lib'
import _ from 'lodash'
import { Datastore, DeviceOptionsAny, Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import {
	MetadataAny,
	ResourceAny,
	TSRDeviceId,
	protectTupleArray,
	deserializeProtectedMap,
	unprotectString,
} from '@shared/models'
import { BaseBridge } from '@shared/tsr-bridge'
import { AnalogInput } from '../models/project/AnalogInput'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { version: CURRENT_VERSION }: { version: string } = require('../../package.json')
export const SERVER_PORT = 5400

/** This handles connected bridges */
export class BridgeHandler {
	server: WebsocketServer

	private outgoingBridges: Map<
		BridgeId,
		{
			bridge: Bridge
			lastTry: number
			connection?: WebsocketConnection
		}
	> = new Map()
	private internalBridge: LocalBridgeConnection | null = null
	private connectedBridges: Map<BridgeId, AbstractBridgeConnection> = new Map()
	private mappings: Mappings = {}
	private timelines: { [timelineId: string]: TSRTimeline } = {}
	private settings: Map<BridgeId, Bridge['settings']> = new Map()
	private analogInputs: {
		[datastoreKey: string]: {
			setting: AnalogInputSetting
			analogInput: AnalogInput
		}
	} = {}
	private datastore: Datastore = {}
	private closed = false
	private connectionCallbacks: BridgeConnectionCallbacks
	reconnectToBridgesInterval: NodeJS.Timer

	constructor(
		private log: LoggerLike,
		private session: SessionHandler,
		private storage: StorageHandler,
		callbacks: BridgeHandlerCallbacks
	) {
		this.connectionCallbacks = {
			...callbacks,
			getMappings: () => this.mappings,
			getTimelines: () => this.timelines,
			onInitialized: (connection) => {
				if (connection.bridgeId == null) return
				this.connectedBridges.set(connection.bridgeId, connection)
			},
			onDisconnected: (connection) => {
				if (connection.bridgeId == null) return
				const currentConnection = this.connectedBridges.get(connection.bridgeId)
				if (currentConnection === connection) {
					// delete only if that's the same connection, otherwise a new one might have been initiated before this one fully closed
					this.connectedBridges.delete(connection.bridgeId)
				}
			},
		}
		this.server = new WebsocketServer(this.log, SERVER_PORT, (connection: WebsocketConnection) => {
			// On connection:

			const bridge = new WebsocketBridgeConnection(
				this.log,
				this.session,
				this.storage,
				connection,
				this.connectionCallbacks
			)

			// Lookup and set the bridgeId, if it is an outgoing
			for (const [bridgeId, outgoing] of this.outgoingBridges.entries()) {
				if (outgoing.connection?.connectionId === connection.connectionId) {
					bridge.bridgeId = bridgeId
					this.connectedBridges.set(bridgeId, bridge)
				}
			}
		})

		this.server.on('close', () => {
			// todo: handle server close?
			this.log.error('Server closed')
		})

		this.storage.on('project', (project: Project) => {
			this.onUpdatedProject(project)
		})

		this.reconnectToBridgesInterval = setInterval(() => {
			this.reconnectToBridges()
		}, 1000)
	}
	getBridgeConnection(bridgeId: BridgeId): AbstractBridgeConnection | undefined {
		return this.connectedBridges.get(bridgeId)
	}
	async onClose(): Promise<void> {
		if (this.internalBridge) {
			await this.internalBridge.destroy()
		}
		this.closed = true

		if (this.reconnectToBridgesInterval) clearInterval(this.reconnectToBridgesInterval)
	}
	onUpdatedProject(project: Project): void {
		if (this.closed) return
		if (project.settings.enableInternalBridge) {
			if (!this.internalBridge) {
				this.internalBridge = new LocalBridgeConnection(
					this.log,
					this.session,
					this.storage,
					this.connectionCallbacks
				)
				this.connectedBridges.set(INTERNAL_BRIDGE_ID, this.internalBridge)
			}
		} else {
			if (this.internalBridge) {
				this.session.updateBridgeStatus(INTERNAL_BRIDGE_ID, null)
				const internalBridge = this.internalBridge
				this.connectedBridges.delete(INTERNAL_BRIDGE_ID)
				this.internalBridge = null
				internalBridge.destroy().catch(this.log.error)
			}
		}

		// Added/updated:
		for (const bridge of Object.values<Bridge>(project.bridges)) {
			if (bridge.outgoing) {
				const existing = this.outgoingBridges.get(bridge.id)
				let addNew = false
				if (!existing) {
					// Added
					addNew = true
				} else if (existing.bridge.url !== bridge.url) {
					// Updated

					existing.connection?.terminate()
					addNew = true
				}

				if (addNew) {
					// Set an initial status
					this.session.updateBridgeStatus(bridge.id, {
						connected: false,
						devices: {},
						peripherals: {},
					})

					this.outgoingBridges.set(bridge.id, {
						bridge,
						lastTry: Date.now(),
					})

					this.tryConnectToBridge(bridge.id)
				}
			}

			this.updateSettings(bridge.id, bridge.settings)
		}
		// Removed
		for (const [bridgeId, existing] of this.outgoingBridges.entries()) {
			if (!project.bridges[unprotectString<BridgeId>(bridgeId)]) {
				// removed:
				existing.connection?.terminate()
				this.outgoingBridges.delete(bridgeId)
			}
		}
	}
	private reconnectToBridges() {
		for (const [bridgeId, bridge] of this.outgoingBridges.entries()) {
			if (!bridge.connection && Date.now() - bridge.lastTry > 10 * 1000) {
				this.tryConnectToBridge(bridgeId)
			}
		}
	}
	private tryConnectToBridge(bridgeId: BridgeId) {
		const bridge = this.outgoingBridges.get(bridgeId)
		if (bridge) {
			bridge.lastTry = Date.now()
			try {
				const connection: WebsocketConnection = this.server.connectToServer(bridge.bridge.url)

				bridge.connection = connection
				connection.on('close', () => {
					// 'close' means that it's really gone.
					// remove bridge:
					delete bridge.connection
				})
			} catch (error) {
				// this.log.warn(`Failed to create a websocket connection to "${bridge.bridge.url}"`)
			}
		}
	}
	updateMappings(mappings: Mappings): void {
		if (!_.isEqual(this.mappings, mappings)) {
			this.mappings = mappings

			for (const bridgeConnection of this.connectedBridges.values()) {
				bridgeConnection.setMappings(mappings)
			}
		}
	}
	updateTimeline(timelineId: string, timeline: TSRTimeline | null): void {
		if (!_.isEqual(this.timelines[timelineId], timeline)) {
			if (timeline) {
				this.timelines[timelineId] = timeline

				for (const bridgeConnection of this.connectedBridges.values()) {
					bridgeConnection.addTimeline(timelineId, timeline)
				}
			} else {
				delete this.timelines[timelineId]

				for (const bridgeConnection of this.connectedBridges.values()) {
					bridgeConnection.removeTimeline(timelineId)
				}
			}
		}
	}
	updateSettings(bridgeId: BridgeId, settings: Bridge['settings']): void {
		const bridgeConnection = this.connectedBridges.get(bridgeId)
		if (bridgeConnection) {
			bridgeConnection.setSettings(settings)
		}
	}
	/** Called from the storage when an AnalogInput has been updated */
	updateAnalogInput(analogInput: AnalogInput | null): void {
		const project = this.storage.getProject()

		const changedDatastoreKeys: string[] = []
		if (analogInput) {
			// Fast path

			const setting = project.analogInputSettings[analogInput.datastoreKey]
			if (setting) {
				this.datastore[analogInput.datastoreKey] = {
					value: analogInput.value,
					modified: analogInput.modified,
				}
			} else {
				delete this.datastore[analogInput.datastoreKey]
			}
			changedDatastoreKeys.push(analogInput.datastoreKey)
		} else {
			// Slow path, regenerate whole datastore:

			const datastore: Datastore = {}
			for (const [datastoreKey, setting] of Object.entries<AnalogInputSetting>(project.analogInputSettings)) {
				if (!setting.fullIdentifier) continue
				const storedAnalog = this.storage.getAnalogInput(setting.fullIdentifier)
				if (!storedAnalog) continue

				datastore[datastoreKey] = {
					value: storedAnalog.value,
					modified: storedAnalog.modified,
				}
				changedDatastoreKeys.push(datastoreKey)
			}
			this.datastore = datastore
		}

		const updates: {
			datastoreKey: string
			value: any | null
			modified: number
		}[] = []
		for (const datastoreKey of changedDatastoreKeys) {
			updates.push({
				datastoreKey,
				value: this.datastore[datastoreKey]?.value ?? null,
				modified: this.datastore[datastoreKey]?.modified ?? 0,
			})
		}
		this.sendUpdateDatastore(updates)
	}
	sendUpdateDatastore(
		updates: {
			datastoreKey: string
			value: any | null
			modified: number
		}[]
	): void {
		for (const bridgeConnection of this.connectedBridges.values()) {
			bridgeConnection.updateDatastore(updates)
		}
	}
	refreshResources(): void {
		for (const bridgeConnection of this.connectedBridges.values()) {
			bridgeConnection.refreshResources()
		}
	}
}

interface BridgeHandlerCallbacks {
	updatedResourcesAndMetadata: (deviceId: TSRDeviceId, resources: ResourceAny[], metadata: MetadataAny | null) => void
	onVersionMismatch: (bridgeId: BridgeId, bridgeVersion: string, ourVersion: string) => void
	onDeviceRefreshStatus: (deviceId: TSRDeviceId, refreshing: boolean) => void
}

interface BridgeConnectionCallbacks extends BridgeHandlerCallbacks {
	getMappings: () => Mappings
	getTimelines: () => { [timelineId: string]: TSRTimeline }
	onInitialized: (connection: AbstractBridgeConnection) => void
	onDisconnected: (connection: AbstractBridgeConnection) => void
}

abstract class AbstractBridgeConnection {
	public bridgeId: BridgeId | null = null

	private sentSettings: Bridge['settings'] | null = null
	private sentMappings: any | null = null
	private sentTimelines: { [timelineId: string]: TSRTimeline } = {}

	constructor(
		protected log: LoggerLike,
		protected session: SessionHandler,
		protected storage: StorageHandler,
		protected callbacks: BridgeConnectionCallbacks
	) {}

	setSettings(settings: Bridge['settings'], force = false) {
		if (force || !_.isEqual(this.sentSettings, settings)) {
			this.sentSettings = _.cloneDeep(settings)
			this.send({
				type: 'setSettings',
				...settings,
				devices: protectTupleArray(Object.entries<DeviceOptionsAny>(settings.devices)),
				peripherals: protectTupleArray(Object.entries<PeripheralSettingsBase>(settings.peripherals)),
			})
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
	updateDatastore(
		updates: {
			datastoreKey: string
			value: any | null
			modified: number
		}[]
	) {
		this.send({ type: 'updateDatastore', updates, currentTime: this.getCurrentTime() })
	}
	peripheralSetKeyDisplay(deviceId: PeripheralId, identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline) {
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
	getKnownPeripherals() {
		// Request a list of the currently known (currently connected and previously connected) peripherals from the Bridge.
		// The bridge will reply with a message handled elsewhere.
		this.send({ type: 'getKnownPeripherals' })
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
	protected onInit(id: BridgeId, version: string, incoming: boolean) {
		if (!this.bridgeId) {
			this.bridgeId = id
		} else if (this.bridgeId !== id) {
			throw new Error(`bridgeId ID mismatch: "${this.bridgeId}" vs "${id}"`)
		}
		this.callbacks.onInitialized(this)

		if (version !== CURRENT_VERSION) {
			this.callbacks.onVersionMismatch(id, version, CURRENT_VERSION)
		}

		if (incoming && this.bridgeId) {
			this.createBridgeInProjectIfNotExists()
		}

		// Send initial commands:
		const project = this.storage.getProject()
		const bridge = project.bridges[unprotectString<BridgeId>(this.bridgeId)]
		if (bridge) {
			this.setSettings(bridge.settings, true)
		} else {
			this.log.error(`Error: Settings bridge "${this.bridgeId}" not found`)
		}
		this.setMappings(this.callbacks.getMappings(), true)
		for (const [timelineId, timeline] of Object.entries<TSRTimeline>(this.callbacks.getTimelines())) {
			this.addTimeline(timelineId, timeline)
		}
		// Sync timelineIds:
		this.getTimelineIds()
		this.session.resetPeripheralTriggerStatuses(this.bridgeId)
		// Sync available peripherals
		this.getKnownPeripherals()
	}
	protected onInitRequestId() {
		if (!this.bridgeId) throw new Error('onInitRequestId: bridgeId not set')
		this.send({ type: 'setId', id: this.bridgeId })
	}
	protected onDeviceStatus(deviceId: TSRDeviceId, ok: boolean, message: string) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')

		const bridgeStatus = this.session.getBridgeStatus(this.bridgeId)
		if (!bridgeStatus) throw new Error('onDeviceStatus: bridgeStatus not set')

		const deviceIdStr = unprotectString<TSRDeviceId>(deviceId)
		if (!bridgeStatus.devices[deviceIdStr]) {
			bridgeStatus.devices[deviceIdStr] = {
				connectionId: 0,
				message: '',
				ok: false,
			}
		}
		let updated = false
		const existing = bridgeStatus.devices[deviceIdStr]
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
	protected onDeviceRemoved(deviceId: TSRDeviceId) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')

		const bridgeStatus = this.session.getBridgeStatus(this.bridgeId)
		if (!bridgeStatus) throw new Error('onDeviceStatus: bridgeStatus not set')

		delete bridgeStatus.devices[unprotectString<TSRDeviceId>(deviceId)]

		this.callbacks.updatedResourcesAndMetadata(deviceId, [], null)
		this.session.updateBridgeStatus(this.bridgeId, bridgeStatus)
	}
	protected _onPeripheralStatus(deviceId: PeripheralId, info: PeripheralInfo, status: 'connected' | 'disconnected') {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')
		this.session.updatePeripheralStatus(this.bridgeId, deviceId, info, status === 'connected')
	}
	protected _onPeripheralTrigger(deviceId: PeripheralId, trigger: 'keyDown' | 'keyUp', identifier: string) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')
		this.session.updatePeripheralTriggerStatus(this.bridgeId, deviceId, identifier, trigger === 'keyDown')
	}
	protected _onPeripheralAnalog(deviceId: PeripheralId, identifier: string, value: AnalogValue) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')
		this.session.updatePeripheralAnalog(this.bridgeId, deviceId, identifier, value)
	}
	protected _onKnownPeripherals(knownPeripherals: Map<PeripheralId, KnownPeripheral>) {
		if (!this.bridgeId) throw new Error('onDeviceStatus: bridgeId not set')

		this.session.updateKnownPeripherals(this.bridgeId, knownPeripherals)
		const project = this.storage.getProject()
		const bridge = project.bridges[unprotectString<BridgeId>(this.bridgeId)]
		if (bridge) {
			for (const peripheralId of knownPeripherals.keys()) {
				const peripheralIdStr = unprotectString(peripheralId)
				if (!bridge.settings.peripherals[peripheralIdStr]) {
					// Initalize with defaults
					bridge.settings.peripherals[peripheralIdStr] = {
						manualConnect: false,
					}
				}
				if (
					!bridge.settings.autoConnectToAllPeripherals &&
					!bridge.settings.peripherals[peripheralIdStr].manualConnect
				) {
					this.session.removePeripheral(this.bridgeId, peripheralId)
				}
			}
		}
		this.storage.updateProject(project)
	}
	protected handleMessage(msg: BridgeAPI.FromBridge.Any) {
		if (msg.type === 'initRequestId') {
			if (this.onInitRequestId) this.onInitRequestId()
		} else if (msg.type === 'init') {
			this.onInit(msg.id, msg.version, msg.incoming)
		} else if (msg.type === 'status') {
			// todo
		} else if (msg.type === 'deviceStatus') {
			if (this.onDeviceStatus) this.onDeviceStatus(msg.deviceId, msg.ok, msg.message)
		} else if (msg.type === 'deviceRemoved') {
			this.onDeviceRemoved(msg.deviceId)
		} else if (msg.type === 'updatedResourcesAndMetadata') {
			this.callbacks.updatedResourcesAndMetadata(msg.deviceId, msg.resources, msg.metadata)
		} else if (msg.type === 'timelineIds') {
			this._syncTimelineIds(msg.timelineIds)
		} else if (msg.type === 'PeripheralStatus') {
			this._onPeripheralStatus(msg.deviceId, msg.info, msg.status)
		} else if (msg.type === 'PeripheralTrigger') {
			this._onPeripheralTrigger(msg.deviceId, msg.trigger, msg.identifier)
		} else if (msg.type === 'PeripheralAnalog') {
			this._onPeripheralAnalog(msg.deviceId, msg.identifier, msg.value)
		} else if (msg.type === 'DeviceRefreshStatus') {
			this.callbacks.onDeviceRefreshStatus(msg.deviceId, msg.refreshing)
		} else if (msg.type === 'KnownPeripherals') {
			this._onKnownPeripherals(deserializeProtectedMap(msg.peripherals))
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
		const bridgeIdStr = unprotectString<BridgeId>(this.bridgeId)
		if (!project.bridges[bridgeIdStr]) {
			project.bridges[bridgeIdStr] = {
				id: this.bridgeId,
				name: unprotectString(this.bridgeId),
				outgoing: false,
				url: '',
				settings: {
					devices: {},
					peripherals: {},
					autoConnectToAllPeripherals: true,
				},
				clientSidePeripheralSettings: {},
			}
			this.storage.updateProject(project)
		}

		// Update the connection status:
		let status = this.session.getBridgeStatus(this.bridgeId)
		if (!status) {
			status = {
				connected: false,
				devices: {},
				peripherals: {},
			}
		}
		status.connected = true

		this.session.updateBridgeStatus(this.bridgeId, status)
	}
	protected abstract send(msg: BridgeAPI.FromSuperConductor.Any): void
	protected abstract getConnectionId(): number
}

export class WebsocketBridgeConnection extends AbstractBridgeConnection {
	constructor(
		log: LoggerLike,
		session: SessionHandler,
		storage: StorageHandler,
		private connection: WebsocketConnection,
		callbacks: BridgeConnectionCallbacks
	) {
		super(log, session, storage, callbacks)
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
					for (const device of Object.values<BridgeDevice>(status.devices)) {
						device.ok = false
						device.connectionId = 0
						device.message = 'Bridge not connected'
					}

					this.session.updateBridgeStatus(this.bridgeId, status)
				}
				this.callbacks.onDisconnected(this)
			}
		})
		this.connection.on('message', this.handleMessage.bind(this))
	}
	protected send(msg: BridgeAPI.FromSuperConductor.Any): void {
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

	constructor(
		log: LoggerLike,
		session: SessionHandler,
		storage: StorageHandler,
		callbacks: BridgeConnectionCallbacks
	) {
		super(log, session, storage, callbacks)
		this.bridgeId = INTERNAL_BRIDGE_ID
		this.baseBridge = new BaseBridge(this.handleMessage.bind(this), this.log)
		this.createBridgeInProjectIfNotExists()
		this.send({
			type: 'setId',
			id: INTERNAL_BRIDGE_ID,
		})
	}
	async destroy(): Promise<void> {
		await this.baseBridge.destroy()
	}
	protected send(msg: BridgeAPI.FromSuperConductor.Any): void {
		try {
			this.baseBridge.handleMessage(msg)
		} catch (err) {
			this.log.error(err)
		}
	}
	protected getConnectionId(): number {
		return this.connectionId
	}
}
