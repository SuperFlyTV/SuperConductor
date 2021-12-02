import { Conductor, ConductorOptions, DeviceOptionsAny, DeviceType } from 'timeline-state-resolver'
import * as _ from 'underscore'

export class TSR {
	casparCGDevice: any = {
		type: DeviceType.CASPARCG,
		options: {
			host: '127.0.0.1',
			port: 5250,
		},
	}

	public conductor: Conductor
	private devices: { [deviceId: string]: DeviceOptionsAny } = {}

	constructor() {
		const c: ConductorOptions = {
			getCurrentTime: Date.now,
			initializeAsClear: true,
			multiThreadedResolver: false,
			proActiveResolve: true,
		}
		this.conductor = new Conductor(c)

		this.conductor.on('error', (e, ...args) => {
			console.error('TSR', e, ...args)
		})
		this.conductor.on('info', (msg, ...args) => {
			console.log('TSR', msg, ...args)
		})
		this.conductor.on('warning', (msg, ...args) => {
			console.log('Warning: TSR', msg, ...args)
		})

		this.conductor.setTimelineAndMappings([], undefined)
		this.conductor.init().catch(console.error)
	}

	public async updateDevices(newDevices: { [deviceId: string]: DeviceOptionsAny }) {
		// Added/updated:
		for (const deviceId in newDevices) {
			const newDevice = newDevices[deviceId]
			const existingDevice = this.devices[deviceId]

			if (!existingDevice || !_.isEqual(existingDevice, newDevice)) {
				if (existingDevice) {
					await this.conductor.removeDevice(deviceId)
				}

				await this.conductor.addDevice(deviceId, newDevice)
				this.devices[deviceId] = newDevice
			}
		}
		// Removed:
		for (const deviceId in this.devices) {
			if (!newDevices[deviceId]) {
				await this.conductor.removeDevice(deviceId)
				delete this.devices[deviceId]
			}
		}
	}
}
