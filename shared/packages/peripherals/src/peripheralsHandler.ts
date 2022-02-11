import EventEmitter from 'events'
import { KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import { Peripheral } from './peripherals/peripheral'
import { PeripheralStreamDeck } from './peripherals/streamdeck'
import { PeripheralXkeys } from './peripherals/xkeys'

export interface PeripheralsHandlerEvents {
	connected: (deviceId: string, deviceName: string) => void
	disconnected: (deviceId: string, deviceName: string) => void

	keyDown: (deviceId: string, identifier: string) => void
	keyUp: (deviceId: string, identifier: string) => void
}
export interface PeripheralsHandler {
	on<U extends keyof PeripheralsHandlerEvents>(event: U, listener: PeripheralsHandlerEvents[U]): this
	emit<U extends keyof PeripheralsHandlerEvents>(event: U, ...args: Parameters<PeripheralsHandlerEvents[U]>): boolean
}
export class PeripheralsHandler extends EventEmitter {
	private devices = new Map<string, Peripheral>()
	private watchers: { stop: () => void }[] = []
	/** Whether we're connected to SuperConductor or not*/
	private connected = false
	constructor(public readonly id: string) {
		super()
	}
	init() {
		// Set up watchers:
		this.watchers.push(PeripheralStreamDeck.Watch((device) => this.handleNewPeripheral(device)))
		this.watchers.push(PeripheralXkeys.Watch((device) => this.handleNewPeripheral(device)))
	}
	setKeyDisplay(deviceId: string, identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline): void {
		const device = this.devices.get(deviceId)
		if (!device) throw new Error(`Device "${deviceId}" not found`)

		device.setKeyDisplay(identifier, keyDisplay)
	}
	async setConnected(connected: boolean): Promise<void> {
		this.connected = connected

		await Promise.all(Array.from(this.devices.values()).map((device) => device.setConnected(connected)))
	}
	async close(): Promise<void> {
		this.watchers.forEach((watcher) => watcher.stop())
		this.watchers = []

		await Promise.all(Array.from(this.devices.values()).map((device) => device.close()))
		this.devices.clear()

		this.removeAllListeners()
	}

	private handleNewPeripheral(device: Peripheral) {
		this.devices.set(device.id, device)

		device.on('connected', () => {
			// This is emitted when the device is reconnected
			device.setConnected(this.connected).catch(console.error)

			if (this.connected) this.emit('connected', device.id, device.name)
		})
		device.on('disconnected', () => {
			if (this.connected) this.emit('disconnected', device.id, device.name)
		})
		device.on('keyDown', (identifier) => {
			if (this.connected) this.emit('keyDown', device.id, identifier)
		})
		device.on('keyUp', (identifier) => {
			if (this.connected) this.emit('keyUp', device.id, identifier)
		})

		device.setConnected(this.connected).catch(console.error)

		// Initial emit:
		if (this.connected) this.emit('connected', device.id, device.name)
	}
}
