import EventEmitter from 'events'
import { BridgeStatus } from '../models/project/Bridge'
import { PeripheralStatus } from '../models/project/Peripheral'
import _ from 'lodash'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { AnalogValue, KnownPeripheral, PeripheralInfo } from '@shared/api'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { CurrentSelectionAny } from '../lib/GUI'
import { getPeripheralId } from '@shared/lib'
import { ActiveAnalog } from '../models/rundown/Analog'

/** This class handles all non-persistant data */
export class SessionHandler extends EventEmitter {
	private bridgeStatuses: { [bridgeId: string]: BridgeStatus } = {}
	private bridgeStatusesHasChanged: { [bridgeId: string]: true } = {}

	private peripherals: { [peripheralId: string]: PeripheralStatus } = {}
	private peripheralsHasChanged: { [peripheralId: string]: true } = {}

	/** Contains a collection of ALL triggers/keys/buttons on all Panels */
	private allTriggers: { [fullIdentifier: string]: ActiveTrigger } = {}
	private allTriggersHasChanged: { [fullIdentifier: string]: true } = {}
	/** Contains a collection of the currently active (pressed) triggers/keys/buttons on all Panels */
	private activeTriggers: { [fullIdentifier: string]: ActiveTrigger } = {}
	private activeTriggersHasChanged = false

	/** Contains a collection of ALL analogs on all Panels */
	private activeAnalogs: { [fullIdentifier: string]: ActiveAnalog } = {}
	private activeAnalogsHasChanged: { [fullIdentifier: string]: true } = {}

	private definingArea: DefiningArea | null = null
	private definingAreaHasChanged = false

	private selection: Readonly<CurrentSelectionAny[]> = [] // Not sent to GUI
	private selectionHasChanged = false

	private emitTimeout: NodeJS.Timeout | null = null

	private emitEverything = false

	terminate(): void {
		this.removeAllListeners()
	}

	triggerEmitAll(): void {
		this.emitEverything = true
		this.triggerUpdate()
	}

	getDefiningArea(): DefiningArea | null {
		return this.definingArea
	}
	updateDefiningArea(definingArea: DefiningArea | null): void {
		this.definingArea = definingArea
		this.definingAreaHasChanged = true
		this.triggerUpdate()
	}

	getBridgeStatuses(): {
		[bridgeId: string]: BridgeStatus
	} {
		return this.bridgeStatuses
	}
	getBridgeStatus(id: string): BridgeStatus | undefined {
		return this.bridgeStatuses[id]
	}
	updateBridgeStatus(id: string, bridgeStatus: BridgeStatus | null): void {
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
	getPeripheralStatus(bridgeId: string, deviceId: string): PeripheralStatus | undefined {
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		return this.peripherals[peripheralId]
	}
	updatePeripheralStatus(bridgeId: string, deviceId: string, info: PeripheralInfo, connected: boolean): void {
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		const existing: PeripheralStatus | undefined = this.peripherals[peripheralId]

		const newDevice: PeripheralStatus = {
			id: deviceId,
			bridgeId: bridgeId,
			info: info,
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
	removePeripheral(bridgeId: string, deviceId: string): void {
		const peripheralId = getPeripheralId(bridgeId, deviceId)
		delete this.peripherals[peripheralId]
		this.peripheralsHasChanged[peripheralId] = true
		this.triggerUpdate()
	}
	updateKnownPeripherals(
		bridgeId: string,
		knownPeripherals: {
			[peripheralId: string]: KnownPeripheral
		}
	): void {
		const bridgeStatus = this.bridgeStatuses[bridgeId]
		if (!bridgeStatus) {
			return
		}

		if (!_.isEqual(knownPeripherals, bridgeStatus.peripherals)) {
			bridgeStatus.peripherals = knownPeripherals
			this.bridgeStatusesHasChanged[bridgeId] = true
		}

		this.triggerUpdate()
	}
	resetPeripheralTriggerStatuses(bridgeId: string): void {
		// Reset all peripheralStatuses for a bridge (like when a bridge is reconnected)

		for (const [fullIdentifier, trigger] of Object.entries(this.allTriggers)) {
			if (trigger.bridgeId === bridgeId) {
				delete this.allTriggers[fullIdentifier]
				delete this.allTriggersHasChanged[fullIdentifier]
			}
		}
		for (const [fullIdentifier, trigger] of Object.entries(this.activeTriggers)) {
			if (trigger.bridgeId === bridgeId) {
				delete this.activeTriggers[fullIdentifier]
				this.activeTriggersHasChanged = true
			}
		}
	}
	updatePeripheralTriggerStatus(bridgeId: string, deviceId: string, identifier: string, down: boolean): void {
		// This is called from a peripheral, when a key is pressed or released

		const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		const device = this.peripherals[peripheralId]
		const trigger: ActiveTrigger = {
			fullIdentifier: fullIdentifier,
			bridgeId: bridgeId,
			deviceId: deviceId,
			deviceName: device?.info.name ?? '',
			identifier: identifier,
		}

		if (!this.allTriggers[fullIdentifier]) {
			this.allTriggers[fullIdentifier] = trigger
			this.allTriggersHasChanged[fullIdentifier] = true
		}

		if (down) {
			if (!this.activeTriggers[fullIdentifier]) {
				this.activeTriggers[fullIdentifier] = trigger
				this.activeTriggersHasChanged = true
			}
		} else {
			if (this.activeTriggers[fullIdentifier]) {
				delete this.activeTriggers[fullIdentifier]
				this.activeTriggersHasChanged = true
			}
		}

		this.triggerUpdate()
	}
	updatePeripheralAnalog(bridgeId: string, deviceId: string, identifier: string, value: AnalogValue): void {
		// This is called from a peripheral, when an analog input is wiggled

		const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		const device = this.peripherals[peripheralId]
		const analog: ActiveAnalog = {
			fullIdentifier: fullIdentifier,
			bridgeId: bridgeId,
			deviceId: deviceId,
			deviceName: device?.info.name ?? '',
			identifier: identifier,
			value: value,
		}

		const previousAnalog = this.activeAnalogs[fullIdentifier]
		if (!previousAnalog) {
			this.activeAnalogs[fullIdentifier] = analog
			this.activeAnalogsHasChanged[fullIdentifier] = true
		} else {
			if (!_.isEqual(previousAnalog.value, analog.value)) {
				this.activeAnalogs[fullIdentifier] = analog
				this.activeAnalogsHasChanged[fullIdentifier] = true
			}
		}

		this.triggerUpdate()
	}
	updateSelection(selection: Readonly<CurrentSelectionAny[]>): void {
		if (!_.isEqual(this.selection, selection)) {
			this.selection = selection
			this.selectionHasChanged = true
			this.triggerUpdate()
		}
	}
	getSelection(): Readonly<CurrentSelectionAny[]> {
		return this.selection
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
			for (const bridgeId of Object.keys(this.bridgeStatuses)) {
				this.bridgeStatusesHasChanged[bridgeId] = true
			}
			for (const peripheralId of Object.keys(this.peripherals)) {
				this.peripheralsHasChanged[peripheralId] = true
			}
			this.activeTriggersHasChanged = true
			this.definingAreaHasChanged = true

			this.emitEverything = false
		}

		for (const bridgeId of Object.keys(this.bridgeStatusesHasChanged)) {
			this.emit('bridgeStatus', bridgeId, this.bridgeStatuses[bridgeId] ?? null)
			delete this.bridgeStatusesHasChanged[bridgeId]
		}
		for (const peripheralId of Object.keys(this.peripheralsHasChanged)) {
			this.emit('peripheral', peripheralId, this.peripherals[peripheralId] ?? null)
			delete this.peripheralsHasChanged[peripheralId]
		}
		for (const fullIdentifier of Object.keys(this.allTriggersHasChanged)) {
			this.emit('allTrigger', fullIdentifier, this.allTriggers[fullIdentifier] ?? null)
			delete this.allTriggersHasChanged[fullIdentifier]
		}
		if (this.activeTriggersHasChanged) {
			const activeTriggers: ActiveTriggers = Object.values(this.activeTriggers)
			this.emit('activeTriggers', activeTriggers)
			this.activeTriggersHasChanged = false
		}
		for (const fullIdentifier of Object.keys(this.activeAnalogsHasChanged)) {
			this.emit('activeAnalog', fullIdentifier, this.activeAnalogs[fullIdentifier] ?? null)
			delete this.activeAnalogsHasChanged[fullIdentifier]
		}
		if (this.definingAreaHasChanged) {
			this.emit('definingArea', this.definingArea)
			this.definingAreaHasChanged = false
		}
		if (this.selectionHasChanged) {
			this.emit('selection', this.selection)
			this.selectionHasChanged = false
		}
	}
}
