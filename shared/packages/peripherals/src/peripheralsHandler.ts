import EventEmitter from 'events'
import {
	KnownPeripheral,
	KeyDisplay,
	KeyDisplayTimeline,
	LoggerLike,
	PeripheralInfo,
	PeripheralSettingsAny,
	PeripheralType,
} from '@shared/api'
import { Peripheral } from './peripherals/peripheral'
import { PeripheralWatcher } from './peripheralWatcher'
import { PeripheralStreamDeck } from './peripherals/streamdeck'
import { PeripheralXkeys } from './peripherals/xkeys'
import { assertNever } from '@shared/lib'

export interface PeripheralsHandlerEvents {
	connected: (peripheralId: string, peripheralInfo: PeripheralInfo) => void
	disconnected: (peripheralId: string, peripheralInfo: PeripheralInfo) => void

	keyDown: (peripheralId: string, identifier: string) => void
	keyUp: (peripheralId: string, identifier: string) => void

	knownPeripherals: (peripherals: { [peripheralId: string]: KnownPeripheral }) => void
}
export interface PeripheralsHandler {
	on<U extends keyof PeripheralsHandlerEvents>(event: U, listener: PeripheralsHandlerEvents[U]): this
	emit<U extends keyof PeripheralsHandlerEvents>(event: U, ...args: Parameters<PeripheralsHandlerEvents[U]>): boolean
}
export class PeripheralsHandler extends EventEmitter {
	private peripherals = new Map<string, Peripheral>()
	private peripheralStatuses = new Map<
		string,
		{
			connected: boolean
			info: PeripheralInfo
		}
	>()
	private watcher?: PeripheralWatcher
	/** Whether we're connected to SuperConductor or not*/
	private connectedToParent = false
	private shouldConnectToSpecific = new Map<string, boolean>()
	private autoConnectToAll = true
	constructor(private log: LoggerLike, public readonly id: string) {
		super()
	}
	init() {
		this.watcher = new PeripheralWatcher()
		this.watcher.on('knownPeripheralsChanged', (peripherals) => {
			this.emit('knownPeripherals', peripherals)
		})
		this.watcher.on('knownPeripheralDiscovered', (id, info) => {
			this.maybeConnectToPeripheral(id, info).catch(this.log.error)
		})
		this.watcher.on('knownPeripheralReconnected', (id, info) => {
			this.maybeConnectToPeripheral(id, info).catch(this.log.error)
		})
	}
	setKeyDisplay(peripheralId: string, identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline): void {
		const peripheral = this.peripherals.get(peripheralId)
		if (!peripheral) throw new Error(`Peripheral "${peripheralId}" not found`)

		peripheral.setKeyDisplay(identifier, keyDisplay)
	}
	/**
	 * @returns The list peripherals seen at any point during this session, be they currently connected or not.
	 */
	getKnownPeripherals() {
		return this.watcher?.getKnownPeripherals() ?? {}
	}
	/**
	 * Updates the settings for how peripherals should be handled.
	 */
	async updatePeripheralsSettings(settings: { [peripheralId: string]: PeripheralSettingsAny }, autoConnect: boolean) {
		// Do this before handling the per-peripheral settings.
		// This is because the behavior of setSpecificPeripheralConnectionPreference
		// depends on the value of the auto connect setting.
		if (autoConnect) {
			await this.enableAutoConnectToAll()
		} else {
			await this.disableAutoConnectToAll()
		}

		const specificPeripheralPromises: Promise<void>[] = []
		for (const [peripheralId, setting] of Object.entries(settings)) {
			specificPeripheralPromises.push(
				this.setSpecificPeripheralConnectionPreference(peripheralId, setting.manualConnect)
			)
		}
		await Promise.all(specificPeripheralPromises)
	}
	async setConnectedToParent(connected: boolean): Promise<void> {
		this.connectedToParent = connected

		this.emitPeripheralConnectedStatuses()

		await Promise.all(
			Array.from(this.peripherals.values()).map((peripheral) => peripheral.setConnectedToParent(connected))
		)
	}
	async close(): Promise<void> {
		await Promise.all(Array.from(this.peripherals.values()).map((peripheral) => peripheral.close()))

		this.watcher?.removeAllListeners()
		this.watcher?.stop()

		this.peripherals.clear()

		this.removeAllListeners()
	}
	private emitPeripheralConnectedStatuses() {
		if (!this.connectedToParent) return

		for (const [peripheralId, info] of Array.from(this.peripheralStatuses.entries())) {
			const peripheral = this.peripherals.get(peripheralId)
			if (peripheral) {
				if (info.connected) {
					this.emit('connected', peripheral.id, info.info)
				} else {
					this.emit('disconnected', peripheral.id, info.info)
				}
			}
		}
	}

	/**
	 * Called when a new peripheral has been connected to.
	 * This is not the same as _discovering_ a peripheral.
	 */
	private handleNewlyConnectedPeripheral(peripheral: Peripheral) {
		this.peripherals.set(peripheral.id, peripheral)
		// We know at this point that the peripheral is connected:
		this.peripheralStatuses.set(peripheral.id, {
			connected: true,
			info: peripheral.info,
		})

		peripheral.on('connected', () => {
			// This is emitted when the peripheral is reconnected
			this.peripheralStatuses.set(peripheral.id, {
				connected: true,
				info: peripheral.info,
			})
			peripheral.setConnectedToParent(this.connectedToParent).catch(this.log.error)

			if (this.connectedToParent) this.emit('connected', peripheral.id, peripheral.info)
		})
		peripheral.on('disconnected', () => {
			this.peripheralStatuses.set(peripheral.id, {
				connected: false,
				info: peripheral.info,
			})
			this.peripherals.delete(peripheral.id)
			if (this.connectedToParent) this.emit('disconnected', peripheral.id, peripheral.info)
		})
		peripheral.on('keyDown', (identifier) => {
			if (this.connectedToParent) this.emit('keyDown', peripheral.id, identifier)
		})
		peripheral.on('keyUp', (identifier) => {
			if (this.connectedToParent) this.emit('keyUp', peripheral.id, identifier)
		})

		peripheral.setConnectedToParent(this.connectedToParent).catch(this.log.error)

		// Initial emit:
		if (this.connectedToParent) this.emit('connected', peripheral.id, peripheral.info)
	}

	/**
	 * Tells the Peripheral class to auto connect to all peripherals.
	 * Does nothing if already enabled.
	 * @returns A promise that resolves once all peripheral initializers have finished.
	 */
	private async enableAutoConnectToAll(): Promise<void> {
		if (this.autoConnectToAll) {
			return
		}

		this.autoConnectToAll = true

		const initPromises: Promise<void>[] = []
		for (const [id, info] of Object.entries(this.getKnownPeripherals())) {
			if (this.peripherals.has(id)) {
				// We already have a connected peripheral instance set up for this ID, so do nothing.
				continue
			}

			// Try to connect to the peripheral.
			initPromises.push(this.maybeConnectToPeripheral(id, info))
		}

		await Promise.all(initPromises)
	}

	/**
	 * Tells the Peripheral class to not auto connect to all peripherals.
	 * Closes any peripherals that aren't explictly marked as ones that should be connected to.
	 * Does nothing if already disabled.
	 * @returns A promise that resolves once all peripherals that should be closed have been closed.
	 */
	private async disableAutoConnectToAll(): Promise<void> {
		if (!this.autoConnectToAll) {
			return
		}

		this.autoConnectToAll = false

		const closePromises: Promise<void>[] = []
		for (const peripheral of this.peripherals.values()) {
			// If the user has indicated that they specifically want to conenct to this peripheral
			// even when auto-connect is off, do nothing.
			if (this.shouldConnectToSpecific.get(peripheral.id)) {
				continue
			}

			// Else, close the peripheral.
			closePromises.push(
				peripheral.close().then(() => {
					this.peripherals.delete(peripheral.id)
				})
			)
		}
		await Promise.all(closePromises)
	}

	/**
	 * Tells the handler if it should connect to a specific peripheral ID or not.
	 * If set to true and not already connected, a connection will be attempted.
	 * If set to false and currently connected, the connection will be closed.
	 */
	private async setSpecificPeripheralConnectionPreference(id: string, shouldConnect: boolean): Promise<void> {
		this.shouldConnectToSpecific.set(id, shouldConnect)

		// If there's no available peripheral with this ID, do nothing.
		const knownPeripheral = this.getKnownPeripherals()[id] as KnownPeripheral | undefined
		if (!knownPeripheral) {
			return
		}

		if (this.autoConnectToAll || shouldConnect) {
			// Try to connect to the peripheral.
			await this.maybeConnectToPeripheral(id, knownPeripheral)
		} else {
			// Close the peripheral.
			const existingPeripheral = this.peripherals.get(id)
			if (!existingPeripheral) {
				return
			}
			await existingPeripheral.close()
			this.peripherals.delete(id)
		}
	}

	/**
	 * Tries to connect to an available peripheral if either auto-connect is on
	 * or if the settings specify that this specific peripheral should be connected to.
	 * Does nothing if already connected to a peripheral with the given ID.
	 */
	private async maybeConnectToPeripheral(id: string, info: KnownPeripheral): Promise<void> {
		// If we already have connected to this peripheral, do nothing.
		const existingPeripheral = this.peripherals.get(id)
		if (existingPeripheral) {
			return
		}

		// Connect to the peripheral if the settings dictate that we should do so.
		const shouldConnect = this.autoConnectToAll || this.shouldConnectToSpecific.get(id)
		if (shouldConnect) {
			const newPeripheral = this.createPeripheralFromAvailableInfo(id, info)
			await newPeripheral.init()
			newPeripheral.hasConnected = true
			this.handleNewlyConnectedPeripheral(newPeripheral)
		}
	}
	/**
	 * Given info about an available peripheral, creates an actual connection to that peripheral
	 * and returns the resulting Peripheral class instance.
	 */
	private createPeripheralFromAvailableInfo(id: string, info: KnownPeripheral): Peripheral {
		switch (info.type) {
			case PeripheralType.STREAMDECK:
				return new PeripheralStreamDeck(this.log, id, info.devicePath)
			case PeripheralType.XKEYS:
				return new PeripheralXkeys(this.log, id, info.devicePath)
			default:
				assertNever(info.type)
		}

		throw new Error(`Unexpected peripheral type "${info.type}"`)
	}
}
