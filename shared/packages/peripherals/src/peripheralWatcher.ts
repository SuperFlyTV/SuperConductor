import { KnownPeripheral, LoggerLike, PeripheralId } from '@shared/api'
import EventEmitter from 'events'
import { PeripheralMIDI } from './peripherals/midi.js'
import { PeripheralStreamDeck } from './peripherals/streamdeck.js'
import { PeripheralXkeys } from './peripherals/xkeys.js'

export interface PeripheralWatcherEvents {
	knownPeripheralDiscovered: [peripheralId: PeripheralId, info: KnownPeripheral]
	knownPeripheralReconnected: [peripheralId: PeripheralId, info: KnownPeripheral]
	knownPeripheralDisconnected: [peripheralId: PeripheralId]
	knownPeripheralsChanged: [peripherals: Map<PeripheralId, KnownPeripheral>]
}

export class PeripheralWatcher extends EventEmitter<PeripheralWatcherEvents> {
	private knownPeripherals = new Map<PeripheralId, KnownPeripheral>()
	private subwatchers: { stop: () => void }[] = []

	constructor(private log: LoggerLike) {
		super()

		// Make javascript happy:
		const boundUpdateDiscoveredPeripheral = this.updateDiscoveredPeripheral.bind(this)

		// Set up subwatchers:
		this.subwatchers.push(PeripheralStreamDeck.Watch(boundUpdateDiscoveredPeripheral, this.log))
		this.subwatchers.push(PeripheralXkeys.Watch(boundUpdateDiscoveredPeripheral))
		this.subwatchers.push(PeripheralMIDI.Watch(boundUpdateDiscoveredPeripheral))
	}

	/**
	 * Updates the watcher's knowledge about a given peripheral.
	 * If no prior info was present, knownPeripheralDiscovered will be emitted.
	 * If prior info was present and new info is provided, knownPeripheralReconnected will be emitted.
	 * If prior info was present and info is now null, knownPeripheralDisconnected will be emitted.
	 * In all cases, knownPeripheralsChanged will be emitted.
	 */
	private updateDiscoveredPeripheral(peripheralId: PeripheralId, info: KnownPeripheral | null): void {
		if (this.knownPeripherals.has(peripheralId)) {
			if (info) {
				this.knownPeripherals.set(peripheralId, info)
				this.emit('knownPeripheralReconnected', peripheralId, info)
			} else {
				// We intentionally don't remove the info from the availablePeriphals set here
				// because we need that information for UI purposes. We still display information
				// about peripherals that were previously connected but are now disconnected.
				this.emit('knownPeripheralDisconnected', peripheralId)
			}
		} else if (info) {
			this.knownPeripherals.set(peripheralId, info)
			this.emit('knownPeripheralDiscovered', peripheralId, info)
		}
		this.emit('knownPeripheralsChanged', this.getKnownPeripherals())
	}

	/**
	 * Stops watching for peripherals.
	 */
	stop(): void {
		this.subwatchers.forEach((subwatcher) => subwatcher.stop())
		this.subwatchers = []
	}

	/**
	 * @returns The list peripherals seen at any point during this session, be they currently connected or not.
	 */
	getKnownPeripherals(): Map<PeripheralId, KnownPeripheral> {
		return new Map<PeripheralId, KnownPeripheral>(this.knownPeripherals.entries())
	}
	getKnownPeripheral(peripheralId: PeripheralId): KnownPeripheral | undefined {
		return this.knownPeripherals.get(peripheralId)
	}
}
