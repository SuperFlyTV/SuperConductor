import EventEmitter from 'events'
import { ResourceAny } from '@shared/models'
import { BridgeStatus } from '../models/project/Bridge'
import { Peripheral } from '../models/project/Peripheral'
import _ from 'lodash'
import { ActiveTriggers } from '../models/rundown/Trigger'

/** This class handles all non-persistant data */
export class SessionHandler extends EventEmitter {
	private resources: { [resourceId: string]: ResourceAny } = {}
	private resourcesHasChanged: { [resourceId: string]: true } = {}

	private bridgeStatuses: { [bridgeId: string]: BridgeStatus } = {}
	private bridgeStatusesHasChanged: { [bridgeId: string]: true } = {}

	private peripherals: { [peripheralId: string]: Peripheral } = {}
	private peripheralsHasChanged: { [peripheralId: string]: true } = {}

	private peripheralTriggers: ActiveTriggers = {}
	private peripheralTriggersHasChanged = false

	private emitTimeout: NodeJS.Timeout | null = null

	private emitEverything = false

	triggerEmitAll() {
		this.emitEverything = true
		this.triggerUpdate()
	}

	getResources() {
		return this.resources
	}
	getResource(id: string): ResourceAny | undefined {
		return this.resources[id]
	}
	getResourceIds(deviceId: string): string[] {
		const ids: string[] = []
		for (const [id, resource] of Object.entries(this.resources)) {
			if (resource.deviceId === deviceId) ids.push(id)
		}
		return ids
	}
	updateResource(id: string, resource: ResourceAny | null) {
		if (resource) {
			this.resources[id] = resource
		} else {
			delete this.resources[id]
			this.resourcesHasChanged[id] = true
		}

		this.triggerUpdate()
	}

	getBridgeStatuses() {
		return this.bridgeStatuses
	}
	getBridgeStatus(id: string): BridgeStatus | undefined {
		return this.bridgeStatuses[id]
	}
	updateBridgeStatus(id: string, bridgeStatus: BridgeStatus | null) {
		if (bridgeStatus) {
			this.bridgeStatuses[id] = bridgeStatus
			this.bridgeStatusesHasChanged[id] = true
		} else {
			if (this.bridgeStatuses[id]) {
				delete this.bridgeStatuses[id]
				this.bridgeStatusesHasChanged[id] = true
			}
		}

		this.triggerUpdate()
	}
	getPeripheralStatus(bridgeId: string, deviceId: string): Peripheral | undefined {
		const peripheralId = `${bridgeId}-${deviceId}`

		return this.peripherals[peripheralId]
	}
	updatePeripheralStatus(bridgeId: string, deviceId: string, deviceName: string, connected: boolean) {
		const peripheralId = `${bridgeId}-${deviceId}`

		const existing: Peripheral | undefined = this.peripherals[peripheralId]

		const newDevice: Peripheral = {
			id: deviceId,
			name: deviceName,
			status: {
				lastConnected: connected ? Date.now() : existing?.status.lastConnected ?? 0,
				connected: connected,
			},
		}
		if (!_.isEqual(newDevice, this.peripherals[peripheralId])) {
			this.peripherals[peripheralId] = newDevice
			this.peripheralsHasChanged[peripheralId] = true
		}

		this.triggerUpdate()
	}
	updatePeripheralTriggerStatus(bridgeId: string, deviceId: string, identifier: string, down: boolean) {
		const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`

		if (down) {
			if (!this.peripheralTriggers[fullIdentifier]) {
				this.peripheralTriggers[fullIdentifier] = true
				this.peripheralTriggersHasChanged = true
			}
		} else {
			if (this.peripheralTriggers[fullIdentifier]) {
				delete this.peripheralTriggers[fullIdentifier]
				this.peripheralTriggersHasChanged = true
			}
		}

		this.triggerUpdate()
	}

	private triggerUpdate() {
		if (!this.emitTimeout) {
			this.emitTimeout = setTimeout(() => {
				this.emitTimeout = null
				this.emitChanges()
			}, 5)
		}
	}
	private emitChanges() {
		if (this.emitEverything) {
			for (const resourceId of Object.keys(this.resources)) {
				this.resourcesHasChanged[resourceId] = true
			}
			for (const bridgeId of Object.keys(this.bridgeStatuses)) {
				this.bridgeStatusesHasChanged[bridgeId] = true
			}
			for (const peripheralId of Object.keys(this.peripherals)) {
				this.peripheralsHasChanged[peripheralId] = true
			}
			this.peripheralTriggersHasChanged = true
		}

		for (const resourceId of Object.keys(this.resourcesHasChanged)) {
			this.emit('resource', resourceId, this.resources[resourceId] ?? null)
			delete this.resourcesHasChanged[resourceId]
		}
		for (const bridgeId of Object.keys(this.bridgeStatusesHasChanged)) {
			this.emit('bridgeStatus', bridgeId, this.bridgeStatuses[bridgeId] ?? null)
			delete this.bridgeStatusesHasChanged[bridgeId]
		}
		for (const peripheralId of Object.keys(this.peripheralsHasChanged)) {
			this.emit('peripheral', peripheralId, this.peripherals[peripheralId] ?? null)
			delete this.peripheralsHasChanged[peripheralId]
		}
		if (this.peripheralTriggersHasChanged) {
			this.emit('peripheralTriggers', this.peripheralTriggers)
			this.peripheralTriggersHasChanged = false
		}
	}
}
