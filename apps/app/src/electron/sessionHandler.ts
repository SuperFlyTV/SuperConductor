import EventEmitter from 'events'
import { BridgeStatus } from '../models/project/Bridge'
import { PeripheralStatus } from '../models/project/Peripheral'
import _ from 'lodash'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { AnalogValue, BridgeId, KnownPeripheral, PeripheralId, PeripheralInfo } from '@shared/api'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { CurrentSelectionAny } from '../lib/GUI'
import { BridgePeripheralId, getPeripheralId } from '@shared/lib'
import { ActiveAnalog } from '../models/rundown/Analog'
import { unprotectString } from '@shared/models'

export interface SessionHandlerEvents {
	knownPeripheralDiscovered: (peripheralId: PeripheralId, info: KnownPeripheral) => void

	bridgeStatus: (bridgeId: BridgeId, status: BridgeStatus | null) => void
	peripheral: (peripheralId: BridgePeripheralId, status: PeripheralStatus | null) => void
	allTrigger: (fullIdentifier: string, activeTrigger: ActiveTrigger | null) => void
	activeTriggers: (activeTriggers: ActiveTriggers) => void
	activeAnalog: (fullIdentifier: string, activeAnalog: ActiveAnalog | null) => void
	definingArea: (definingArea: DefiningArea | null) => void
	selection: (selection: Readonly<CurrentSelectionAny[]>) => void
}
export interface SessionHandler {
	on<U extends keyof SessionHandlerEvents>(event: U, listener: SessionHandlerEvents[U]): this
	emit<U extends keyof SessionHandlerEvents>(event: U, ...args: Parameters<SessionHandlerEvents[U]>): boolean
}

/** This class handles all non-persistant data */
export class SessionHandler extends EventEmitter {
	private bridgeStatuses = new Map<BridgeId, BridgeStatus>()
	private bridgeStatusesHasChanged = new Set<BridgeId>()

	private peripherals = new Map<BridgePeripheralId, PeripheralStatus>()
	private peripheralsHasChanged = new Set<BridgePeripheralId>()

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

	getBridgeStatus(id: BridgeId): BridgeStatus | undefined {
		return this.bridgeStatuses.get(id)
	}
	updateBridgeStatus(id: BridgeId, bridgeStatus: BridgeStatus | null): void {
		if (bridgeStatus) {
			this.bridgeStatuses.set(id, bridgeStatus)
			this.bridgeStatusesHasChanged.add(id)
		} else {
			if (this.bridgeStatuses.has(id)) {
				this.bridgeStatuses.delete(id)
				this.bridgeStatusesHasChanged.add(id)
			}
		}

		this.triggerUpdate()
	}
	getPeripheralStatus(bridgeId: BridgeId, deviceId: PeripheralId): PeripheralStatus | undefined {
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		return this.peripherals.get(peripheralId)
	}
	updatePeripheralStatus(bridgeId: BridgeId, deviceId: PeripheralId, info: PeripheralInfo, connected: boolean): void {
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		const existing = this.peripherals.get(peripheralId)

		const newDevice: PeripheralStatus = {
			id: deviceId,
			bridgeId: bridgeId,
			info: info,
			status: {
				lastConnected: connected ? Date.now() : existing?.status.lastConnected ?? 0,
				connected: connected,
			},
		}
		if (!_.isEqual(newDevice, this.peripherals.get(peripheralId))) {
			this.peripherals.set(peripheralId, newDevice)
			this.peripheralsHasChanged.add(peripheralId)
		}

		this.triggerUpdate()
	}
	removePeripheral(bridgeId: BridgeId, deviceId: PeripheralId): void {
		const peripheralId = getPeripheralId(bridgeId, deviceId)
		this.peripherals.delete(peripheralId)
		this.peripheralsHasChanged.add(peripheralId)
		this.triggerUpdate()
	}
	updateKnownPeripherals(bridgeId: BridgeId, knownPeripherals: Map<PeripheralId, KnownPeripheral>): void {
		const bridgeStatus = this.bridgeStatuses.get(bridgeId)
		if (!bridgeStatus) {
			return
		}

		const knownPeripheralsObj: {
			[PeripheralId: string]: KnownPeripheral
		} = {}

		for (const [deviceId, knownPeripheral] of knownPeripherals.entries()) {
			knownPeripheralsObj[unprotectString<PeripheralId>(deviceId)] = knownPeripheral
		}

		if (!_.isEqual(knownPeripheralsObj, bridgeStatus.peripherals)) {
			bridgeStatus.peripherals = knownPeripheralsObj
			this.bridgeStatusesHasChanged.add(bridgeId)
		}

		this.triggerUpdate()
	}
	resetPeripheralTriggerStatuses(bridgeId: BridgeId): void {
		// Reset all peripheralStatuses for a bridge (like when a bridge is reconnected)

		for (const [fullIdentifier, trigger] of Object.entries<ActiveTrigger>(this.allTriggers)) {
			if (trigger.bridgeId === bridgeId) {
				delete this.allTriggers[fullIdentifier]
				delete this.allTriggersHasChanged[fullIdentifier]
			}
		}
		for (const [fullIdentifier, trigger] of Object.entries<ActiveTrigger>(this.activeTriggers)) {
			if (trigger.bridgeId === bridgeId) {
				delete this.activeTriggers[fullIdentifier]
				this.activeTriggersHasChanged = true
			}
		}
	}
	updatePeripheralTriggerStatus(bridgeId: BridgeId, deviceId: PeripheralId, identifier: string, down: boolean): void {
		// This is called from a peripheral, when a key is pressed or released

		const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		const device = this.peripherals.get(peripheralId)
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
	updatePeripheralAnalog(bridgeId: BridgeId, deviceId: PeripheralId, identifier: string, value: AnalogValue): void {
		// This is called from a peripheral, when an analog input is wiggled

		const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`
		const peripheralId = getPeripheralId(bridgeId, deviceId)

		const device = this.peripherals.get(peripheralId)
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
			for (const bridgeId of this.bridgeStatuses.keys()) {
				this.bridgeStatusesHasChanged.add(bridgeId)
			}
			for (const peripheralId of this.peripherals.keys()) {
				this.peripheralsHasChanged.add(peripheralId)
			}
			this.activeTriggersHasChanged = true
			this.definingAreaHasChanged = true

			this.emitEverything = false
		}

		for (const bridgeId of this.bridgeStatusesHasChanged.keys()) {
			this.emit('bridgeStatus', bridgeId, this.bridgeStatuses.get(bridgeId) ?? null)
			this.bridgeStatusesHasChanged.delete(bridgeId)
		}
		for (const peripheralId of this.peripheralsHasChanged.keys()) {
			this.emit('peripheral', peripheralId, this.peripherals.get(peripheralId) ?? null)
			this.peripheralsHasChanged.delete(peripheralId)
		}
		for (const fullIdentifier of Object.keys(this.allTriggersHasChanged)) {
			this.emit('allTrigger', fullIdentifier, this.allTriggers[fullIdentifier] ?? null)
			delete this.allTriggersHasChanged[fullIdentifier]
		}
		if (this.activeTriggersHasChanged) {
			const activeTriggers: ActiveTriggers = Object.values<ActiveTrigger>(this.activeTriggers)
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
