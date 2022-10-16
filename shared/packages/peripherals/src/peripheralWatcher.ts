import { AvailablePeripheral } from '@shared/api'
import EventEmitter from 'events'
import { PeripheralStreamDeck } from './peripherals/streamdeck'
import { PeripheralXkeys } from './peripherals/xkeys'

export interface PeripheralWatcherEvents {
	availablePeripheralDiscovered: (peripheralId: string, info: AvailablePeripheral) => void
	availablePeripheralReconnected: (peripheralId: string, info: AvailablePeripheral) => void
	availablePeripheralDisconnected: (peripheralId: string) => void
	availablePeripheralsChanged: (peripherals: { [peripheralId: string]: AvailablePeripheral }) => void
}
export interface PeripheralWatcher {
	on<U extends keyof PeripheralWatcherEvents>(event: U, listener: PeripheralWatcherEvents[U]): this
	emit<U extends keyof PeripheralWatcherEvents>(event: U, ...args: Parameters<PeripheralWatcherEvents[U]>): boolean
}

export class PeripheralWatcher extends EventEmitter {
	private availablePeripherals = new Map<string, AvailablePeripheral>()
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
	 * If no prior info was present, availablePeripheralDiscovered will be emitted.
	 * If prior info was present, availablePeripheralReconnected will be emitted.
	 * If no info is provided, availablePeripheralDisconnected will be emitted.
	 * In all cases, availablePeripheralsChanged will be emitted.
	 */
	private updateDiscoveredPeripheral(peripheralId: string, info: AvailablePeripheral | null): void {
		if (this.availablePeripherals.has(peripheralId)) {
			if (info) {
				this.availablePeripherals.set(peripheralId, info)
				this.emit('availablePeripheralReconnected', peripheralId, info)
			} else {
				// We intentionally don't remove the info from the availablePeriphals set here
				// because we need that information for UI purposes. We still display information
				// about peripherals that were previously connected but are now disconnected.
				this.emit('availablePeripheralDisconnected', peripheralId)
			}
		} else if (info) {
			this.availablePeripherals.set(peripheralId, info)
			this.emit('availablePeripheralDiscovered', peripheralId, info)
		}
		this.emit('availablePeripheralsChanged', this.getAvailablePeripherals())
	}

	/**
	 * Stops watching for peripherals.
	 */
	stop() {
		this.subwatchers.forEach((subwatcher) => subwatcher.stop())
		this.subwatchers = []
	}

	/**
	 * @returns The list peripherals seen at any point during this session, be they currently connected or not.
	 */
	getAvailablePeripherals() {
		return Object.fromEntries(this.availablePeripherals.entries())
	}
}
