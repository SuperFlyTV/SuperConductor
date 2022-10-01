import { EventEmitter } from 'events'
import { AvailablePeripheral, KeyDisplay, KeyDisplayTimeline, LoggerLike, PeripheralInfo } from '@shared/api'
import { TimelineTracker } from '@shared/lib'

export interface PeripheralEvents {
	connected: () => void
	disconnected: () => void

	keyDown: (identifier: string) => void
	keyUp: (identifier: string) => void
}
export declare interface Peripheral {
	on<U extends keyof PeripheralEvents>(event: U, listener: PeripheralEvents[U]): this
	emit<U extends keyof PeripheralEvents>(event: U, ...args: Parameters<PeripheralEvents[U]>): boolean
}
export type AvailablePeripheralCallback = (peripherals: { [peripheralId: string]: AvailablePeripheral }) => void
export abstract class Peripheral extends EventEmitter {
	protected static ShouldConnectToSpecific = new Map<string, boolean>()
	protected static AutoConnectToAll = true
	protected static Instances = new Map<string, Peripheral>()
	private static AvailablePeripherals = new Map<string, AvailablePeripheral>()
	private static AvailablePeripheralsCallbacks: AvailablePeripheralCallback[] = []
	private trackers: { [ident: string]: TimelineTracker } = {}
	constructor(
		protected log: LoggerLike,
		/** Locally unique id */
		public readonly id: string
	) {
		super()
	}

	abstract get info(): PeripheralInfo
	/** True if connected to the peripheral */
	public connected = false
	/** True if in the process of connecting to the peripheral */
	public initializing = false
	/** True if the peripheral has connected at least once before */
	protected hasConnected = false

	/**
	 * Tells the Peripheral class to auto connect to all peripherals.
	 * Does nothing if already enabled.
	 * @returns A promise that resolves once all peripheral initializers have finished.
	 */
	static async EnableAutoConnectToAll(): Promise<void> {
		if (Peripheral.AutoConnectToAll) {
			return
		}

		Peripheral.AutoConnectToAll = true

		const initPromises: Promise<void>[] = []
		for (const device of Peripheral.Instances.values()) {
			if (!device.initializing && !device.connected) {
				initPromises.push(
					device.init().then(() => {
						if (device.hasConnected) {
							device.emit('connected')
						} else {
							// Hack
							Object.getPrototypeOf(device).constructor.OnDevice(device)
						}
					})
				)
			}
		}
		await Promise.all(initPromises)
	}

	/**
	 * Tells the Peripheral class to not auto connect to all peripherals.
	 * Closes any peripherals that aren't explictly marked as ones that should be connected to.
	 * Does nothing if already disabled.
	 * @returns A promise that resolves once all peripherals that should be closed have been closed.
	 */
	static async DisableAutoConnectToAll(): Promise<void> {
		if (!Peripheral.AutoConnectToAll) {
			return
		}

		Peripheral.AutoConnectToAll = false

		const closePromises: Promise<void>[] = []
		for (const device of Peripheral.Instances.values()) {
			if (device.connected && !Peripheral.ShouldConnectToSpecific.get(device.id)) {
				closePromises.push(device.close())
			}
		}
		await Promise.all(closePromises)
	}

	/**
	 * Tells the Peripheral class if it should connect to a specific deviceId or not.
	 * If set to true and not already connected, a connection will be attempted.
	 * If set to false and currently connected, the connection will be closed.
	 */
	static async SetSpecificDeviceConnectionPreference(deviceId: string, shouldConnect: boolean): Promise<void> {
		Peripheral.ShouldConnectToSpecific.set(deviceId, shouldConnect)

		if (Peripheral.AutoConnectToAll) {
			// The peripheral connection won't be handled here.
			return
		}

		const device = Peripheral.Instances.get(deviceId)
		if (device) {
			if (device?.connected && !shouldConnect) {
				await device.close()
			} else if (!device?.connected && shouldConnect) {
				await device?.init().then(() => {
					if (device.hasConnected) {
						device.emit('connected')
					} else {
						// Hack
						Object.getPrototypeOf(device).constructor.OnDevice(device)
					}
				})
			}
		}
	}

	static GetSpecificDeviceConnectionPreference(deviceId: string): boolean {
		return !!Peripheral.ShouldConnectToSpecific.get(deviceId)
	}

	protected static AddAvailableDevice(peripheralId: string, info: AvailablePeripheral): void {
		if (Peripheral.AvailablePeripherals.has(peripheralId)) {
			return
		}
		Peripheral.AvailablePeripherals.set(peripheralId, info)
		Peripheral.AvailablePeripheralsCallbacks.forEach((cb) => cb(Peripheral.GetAvailableDevices()))
	}

	static GetAvailableDevices() {
		return Object.fromEntries(Peripheral.AvailablePeripherals.entries())
	}

	static AddAvailableDeviceCallback(cb: AvailablePeripheralCallback) {
		Peripheral.AvailablePeripheralsCallbacks.push(cb)
	}

	public setKeyDisplay(identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline): void {
		if (this.trackers[identifier]) {
			this.trackers[identifier].stop()
			delete this.trackers[identifier]
		}

		if (Array.isArray(keyDisplay)) {
			// It is a timeline, which means that we should resolve it and track it.

			this.trackers[identifier] = new TimelineTracker(this.log, keyDisplay, (keyDisplay) => {
				this._setKeyDisplay(identifier, keyDisplay).catch(this.log.error)
			})
		} else {
			this._setKeyDisplay(identifier, keyDisplay).catch(this.log.error)
		}
	}
	protected abstract _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay): Promise<void>
	protected async _close(): Promise<void> {
		for (const tracker of Object.values(this.trackers)) {
			tracker.stop()
		}
		this.trackers = {}
	}
	abstract setConnectedToParent(connected: boolean): Promise<void>
	abstract init(): Promise<void>
	abstract close(): Promise<void>
}
