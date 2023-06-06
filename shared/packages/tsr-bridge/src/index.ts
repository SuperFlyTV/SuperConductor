import { BridgeAPI, BridgeId, LoggerLike } from '@shared/api'
import { assertNever } from '@shared/lib'
import { MetadataAny, ResourceAny, serializeProtectedMap } from '@shared/models'
import { PeripheralsHandler } from '@shared/peripherals'
import { clone } from 'lodash'
import { Datastore } from 'timeline-state-resolver'
import { Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { TSR } from './TSR'
import { TSRDeviceId } from '@shared/models'
import { deserializeProtectedMap } from '@shared/models'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: CURRENT_VERSION }: { version: string } = require('../package.json')

export class BaseBridge {
	peripheralsHandler: PeripheralsHandler | null = null
	private myBridgeId: BridgeId | null = null
	private tsr: TSR
	private storedTimelines: {
		[id: string]: TSRTimeline
	} = {}

	private dataStore: Datastore = {}
	private mappings: Mappings | undefined = undefined

	private peripheralsHandlerSend: (message: BridgeAPI.FromBridge.Any) => void | null = () => null
	private sendAndCatch: (msg: BridgeAPI.FromBridge.Any) => void

	constructor(private send: (msg: BridgeAPI.FromBridge.Any) => void, private log: LoggerLike) {
		this.tsr = new TSR(log)
		this.sendAndCatch = (msg: BridgeAPI.FromBridge.Any) => {
			try {
				send(msg)
			} catch (e) {
				log?.error(e)
			}
		}
		this.tsr.send = this.sendAndCatch
	}

	private setupPeripheralsHandler(bridgeId: BridgeId): PeripheralsHandler {
		const peripheralsHandler = new PeripheralsHandler(this.log, bridgeId)

		peripheralsHandler.on('connected', (deviceId, info) => {
			this.peripheralsHandlerSend({ type: 'PeripheralStatus', deviceId, info, status: 'connected' })
			this.peripheralsHandlerSend({
				type: 'KnownPeripherals',
				peripherals: serializeProtectedMap(peripheralsHandler.getKnownPeripherals()),
			})
		})
		peripheralsHandler.on('disconnected', (deviceId, info) => {
			this.peripheralsHandlerSend({ type: 'PeripheralStatus', deviceId, info, status: 'disconnected' })
			this.peripheralsHandlerSend({
				type: 'KnownPeripherals',
				peripherals: serializeProtectedMap(peripheralsHandler.getKnownPeripherals()),
			})
		})
		peripheralsHandler.on('keyDown', (deviceId, identifier) => {
			this.peripheralsHandlerSend({ type: 'PeripheralTrigger', trigger: 'keyDown', deviceId, identifier })
		})
		peripheralsHandler.on('keyUp', (deviceId, identifier) => {
			this.peripheralsHandlerSend({ type: 'PeripheralTrigger', trigger: 'keyUp', deviceId, identifier })
		})
		peripheralsHandler.on('analog', (deviceId, identifier, value) => {
			this.peripheralsHandlerSend({ type: 'PeripheralAnalog', deviceId, identifier, value })
		})
		peripheralsHandler.on('knownPeripherals', (peripherals) => {
			this.peripheralsHandlerSend({ type: 'KnownPeripherals', peripherals: serializeProtectedMap(peripherals) })
		})

		peripheralsHandler.init()

		// Initial status

		return peripheralsHandler
	}

	private playTimeline(id: string, newTimeline: TSRTimeline, currentTime: number) {
		this.storedTimelines[id] = newTimeline

		this.updateTSR(currentTime)
		return Date.now()
	}

	private stopTimeline(id: string, currentTime: number) {
		delete this.storedTimelines[id]
		this.updateTSR(currentTime)
	}
	private updateDatastore(
		updates: {
			datastoreKey: string
			value: any | null
			modified: number
		}[],
		currentTime: number
	) {
		for (const update of updates) {
			if (update.value === null) {
				delete this.dataStore[update.datastoreKey]
			} else {
				this.dataStore[update.datastoreKey] = {
					value: update.value,
					modified: update.modified,
				}
			}
		}
		this.updateTSRDatastore(currentTime)
	}

	private updateTSR(currentTime: number) {
		this.tsr.setCurrentTime(currentTime)

		const fullTimeline: TSRTimeline = []

		for (const timeline of Object.values<TSRTimeline>(this.storedTimelines)) {
			for (const obj of timeline) {
				fullTimeline.push(obj)
			}
		}
		// log.info('fullTimeline', JSON.stringify(fullTimeline, undefined, 2))
		// log.info('mapping', JSON.stringify(mapping, undefined, 2))

		this.tsr.conductor.setTimelineAndMappings(fullTimeline, this.mappings)
	}
	private updateTSRDatastore(currentTime: number) {
		this.tsr.setCurrentTime(currentTime)

		this.tsr.conductor.setDatastore(clone(this.dataStore)) // shallow clone
	}

	private updateMappings(newMappings: Mappings, currentTime: number) {
		this.mappings = newMappings
		this.updateTSR(currentTime)
	}
	/** To be called when our bridgeId has been determined. This is basivally the initialize function */
	async onReceivedBridgeId(bridgeId: BridgeId): Promise<void> {
		if (this.myBridgeId !== bridgeId) {
			this.myBridgeId = bridgeId

			if (this.peripheralsHandler) {
				try {
					await this.peripheralsHandler.close()
				} catch (e) {
					this.log?.error(e)
				}
				this.peripheralsHandler = null
			}
		}
		try {
			if (!this.peripheralsHandler) {
				this.peripheralsHandler = this.setupPeripheralsHandler(this.myBridgeId)
			}

			this.peripheralsHandlerSend = this.sendAndCatch
			await this.peripheralsHandler.setConnectedToParent(true)

			this.tsr.reportAllStatuses()
		} catch (e) {
			this.log?.error(e)
		}
	}

	handleMessage(msg: BridgeAPI.FromSuperConductor.Any): void {
		if (msg.type === 'setId') {
			this.onReceivedBridgeId(msg.id)
				// Wait until after the initialization of things like the peripherals handler
				// before telling SuperConductor that the bridge is ready.
				.then(() => this.send({ type: 'init', id: msg.id, version: CURRENT_VERSION, incoming: false }))
				.catch((e) => this.log?.error(e))
		} else if (msg.type === 'addTimeline') {
			this.playTimeline(msg.timelineId, msg.timeline, msg.currentTime)
		} else if (msg.type === 'removeTimeline') {
			this.stopTimeline(msg.timelineId, msg.currentTime)
		} else if (msg.type === 'updateDatastore') {
			this.updateDatastore(msg.updates, msg.currentTime)
		} else if (msg.type === 'getTimelineIds') {
			this.send({ type: 'timelineIds', timelineIds: Object.keys(this.storedTimelines) })
		} else if (msg.type === 'setMappings') {
			this.updateMappings(msg.mappings, msg.currentTime)
		} else if (msg.type === 'setSettings') {
			if (!this.peripheralsHandler) throw new Error('PeripheralsHandler not initialized')

			this.tsr.updateDevices(deserializeProtectedMap(msg.devices)).catch((e) => this.log?.error(e))
			this.peripheralsHandler
				.updatePeripheralsSettings(deserializeProtectedMap(msg.peripherals), msg.autoConnectToAllPeripherals)
				.catch((e) => this.log?.error(e))
		} else if (msg.type === 'refreshResources') {
			this.tsr.refreshResourcesAndMetadata(
				(deviceId: TSRDeviceId, resources: ResourceAny[], metadata: MetadataAny) => {
					this.send({
						type: 'updatedResourcesAndMetadata',
						deviceId,
						resources,
						metadata,
					})
				}
			)
		} else if (msg.type === 'peripheralSetKeyDisplay') {
			if (!this.peripheralsHandler) throw new Error('PeripheralsHandler not initialized')

			this.peripheralsHandler.setKeyDisplay(msg.deviceId, msg.identifier, msg.keyDisplay)
		} else if (msg.type === 'getKnownPeripherals') {
			if (!this.peripheralsHandler) throw new Error('PeripheralsHandler not initialized')

			this.send({
				type: 'KnownPeripherals',
				peripherals: serializeProtectedMap(this.peripheralsHandler.getKnownPeripherals()),
			})
		} else {
			assertNever(msg)
		}
	}

	async destroy(): Promise<void> {
		if (this.peripheralsHandler) {
			await this.peripheralsHandler.close()
			this.peripheralsHandler = null
		}
	}
}
