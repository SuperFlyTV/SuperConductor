import EventEmitter from 'events'
import { KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import { Peripheral } from './peripherals/peripheral'
import { PeripheralStreamDeck } from './peripherals/streamdeck'
import { PeripheralXkeys } from './peripherals/xkeys'
// eslint-disable-next-line node/no-extraneous-import
import winston from 'winston'

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
	private devicesConnected = new Map<string, boolean>()
	private watchers: { stop: () => void }[] = []
	/** Whether we're connected to SuperConductor or not*/
	private connectedToParent = false
	constructor(private log: winston.Logger, public readonly id: string) {
		super()
	}
	init() {
		// Set up watchers:
		this.watchers.push(PeripheralStreamDeck.Watch(this.log, (device) => this.handleNewPeripheral(device)))
		this.watchers.push(PeripheralXkeys.Watch(this.log, (device) => this.handleNewPeripheral(device)))
	}
	setKeyDisplay(deviceId: string, identifier: string, keyDisplay: KeyDisplay | KeyDisplayTimeline): void {
		const device = this.devices.get(deviceId)
		if (!device) throw new Error(`Device "${deviceId}" not found`)

		device.setKeyDisplay(identifier, keyDisplay)
	}
	async setConnectedToParent(connected: boolean): Promise<void> {
		this.connectedToParent = connected

		this.emitDeviceConnectedStatuses()

		await Promise.all(Array.from(this.devices.values()).map((device) => device.setConnectedToParent(connected)))
	}
	async close(): Promise<void> {
		await Promise.all(Array.from(this.devices.values()).map((device) => device.close()))

		this.watchers.forEach((watcher) => watcher.stop())
		this.watchers = []

		this.devices.clear()

		this.removeAllListeners()
	}
	private emitDeviceConnectedStatuses() {
		if (!this.connectedToParent) return

		for (const [deviceId, connected] of Array.from(this.devicesConnected.entries())) {
			const device = this.devices.get(deviceId)
			if (device) {
				if (connected) {
					this.emit('connected', device.id, device.name)
				} else {
					this.emit('disconnected', device.id, device.name)
				}
			}
		}
	}

	private handleNewPeripheral(device: Peripheral) {
		// This is called when a new devices has been discovered

		this.devices.set(device.id, device)
		// We know at this point that the device is connected:
		this.devicesConnected.set(device.id, true)

		device.on('connected', () => {
			// This is emitted when the device is reconnected
			this.devicesConnected.set(device.id, true)
			device.setConnectedToParent(this.connectedToParent).catch(this.log.error)

			if (this.connectedToParent) this.emit('connected', device.id, device.name)
		})
		device.on('disconnected', () => {
			this.devicesConnected.set(device.id, false)
			if (this.connectedToParent) this.emit('disconnected', device.id, device.name)
		})
		device.on('keyDown', (identifier) => {
			if (this.connectedToParent) this.emit('keyDown', device.id, identifier)
		})
		device.on('keyUp', (identifier) => {
			if (this.connectedToParent) this.emit('keyUp', device.id, identifier)
		})

		device.setConnectedToParent(this.connectedToParent).catch(this.log.error)

		// Initial emit:
		if (this.connectedToParent) this.emit('connected', device.id, device.name)
	}
}
