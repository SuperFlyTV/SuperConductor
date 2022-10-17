import { KnownPeripheral } from '@shared/api'
import EventEmitter from 'events'
import { PeripheralStreamDeck } from './peripherals/streamdeck'
import { PeripheralXkeys } from './peripherals/xkeys'

export interface PeripheralWatcherEvents {
	knownPeripheralDiscovered: (peripheralId: string, info: KnownPeripheral) => void
	knownPeripheralReconnected: (peripheralId: string, info: KnownPeripheral) => void
	knownPeripheralDisconnected: (peripheralId: string) => void
	knownPeripheralsChanged: (peripherals: { [peripheralId: string]: KnownPeripheral }) => void
}
export interface PeripheralWatcher {
	on<U extends keyof PeripheralWatcherEvents>(event: U, listener: PeripheralWatcherEvents[U]): this
	emit<U extends keyof PeripheralWatcherEvents>(event: U, ...args: Parameters<PeripheralWatcherEvents[U]>): boolean
}

export class PeripheralWatcher extends EventEmitter {
	private knownPeripherals = new Map<string, KnownPeripheral>()
	private subwatchers: { stop: () => void }[] = []

	constructor() {
		super()

		// Make javascript happy:
		this.updateDiscoveredPeripheral = this.updateDiscoveredPeripheral.bind(this)

		// Set up subwatchers:
		this.subwatchers.push(PeripheralStreamDeck.Watch(this.updateDiscoveredPeripheral))
		this.subwatchers.push(PeripheralXkeys.Watch(this.updateDiscoveredPeripheral))
	}

	/**
	 * Updates the watcher's knowledge about a given peripheral.
	 * If no prior info was present, knownPeripheralDiscovered will be emitted.
	 * If prior info was present and new info is provided, knownPeripheralReconnected will be emitted.
	 * If prior info was present and info is now null, knownPeripheralDisconnected will be emitted.
	 * In all cases, knownPeripheralsChanged will be emitted.
	 */
	private updateDiscoveredPeripheral(peripheralId: string, info: KnownPeripheral | null): void {
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
	getKnownPeripherals(): { [peripheralId: string]: KnownPeripheral } {
		return Object.fromEntries(this.knownPeripherals.entries())
	}
	getKnownPeripheral(peripheralId: string): KnownPeripheral | undefined {
		return this.knownPeripherals.get(peripheralId)
	}
}
