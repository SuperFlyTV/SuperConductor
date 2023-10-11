import _ from 'lodash'
import { Conductor, ConductorOptions, DeviceOptionsAny, DeviceType, OSCDeviceType } from 'timeline-state-resolver'
import { MetadataAny, ResourceAny, TSRDeviceId, unprotectString } from '@shared/models'
import { BridgeAPI, LoggerLike } from '@shared/api'
import { CasparCGSideload } from './sideload/CasparCG'
import { AtemSideload } from './sideload/Atem'
import { OBSSideload } from './sideload/OBS'
import { VMixSideload } from './sideload/VMix'
import { OSCSideload } from './sideload/OSC'
import { HTTPSendSideload } from './sideload/HTTPSend'
import { HyperdeckSideload } from './sideload/Hyperdeck'
import { SideLoadDevice } from './sideload/sideload'
import { TCPSendSideload } from './sideload/TCPSend'
import { TriCasterSideload } from './sideload/TriCaster'
import { stringifyError } from '@shared/lib'

export class TSR {
	public newConnection = false
	public conductor: Conductor
	public send: (message: BridgeAPI.FromBridge.Any) => void
	private devices = new Map<TSRDeviceId, DeviceOptionsAny>()

	private sideLoadedDevices = new Map<TSRDeviceId, SideLoadDevice>()

	private currentTimeDiff = 0
	private deviceStatus = new Map<TSRDeviceId, DeviceStatus>()

	public deviceOptions = new Map<TSRDeviceId, DeviceOptionsAny>()
	private _triggerUpdateDevicesCheckAgain = false
	private _triggerUpdateDevicesTimeout: NodeJS.Timeout | undefined
	private _updateDevicesIsRunning = false

	constructor(private log: LoggerLike) {
		const c: ConductorOptions = {
			getCurrentTime: () => this.getCurrentTime(),
			multiThreadedResolver: false,
			proActiveResolve: true,
		}
		this.conductor = new Conductor(c)

		this.conductor.on('error', (e, ...args) => {
			log.error('TSR', stringifyError(e), ...args)
		})
		this.conductor.on('info', (msg, ...args) => {
			log.info('TSR', msg, ...args)
		})
		this.conductor.on('warning', (msg, ...args) => {
			log.warn('TSR', msg, ...args)
		})
		this.conductor.on('debug', (msg, ...args) => {
			log.debug('TSR', msg, ...args)
		})

		this.conductor.setTimelineAndMappings([], undefined)
		this.conductor.init().catch((e) => log.error(stringifyError(e)))

		this.send = () => {
			throw new Error('TSR.send() not set!')
		}
	}
	/**
	 * Syncs the currentTime, this is useful when TSR-Bridge runs on another computer than SuperConductor,
	 * where the local time might differ from the SuperConductor.
	 */
	public setCurrentTime(currentTime: number): void {
		if (currentTime) this.currentTimeDiff = currentTime - Date.now()
	}
	public getCurrentTime(): number {
		return Date.now() + this.currentTimeDiff
	}

	public triggerUpdateDevices(): void {
		if (this._triggerUpdateDevicesTimeout) {
			clearTimeout(this._triggerUpdateDevicesTimeout)
		}
		this._triggerUpdateDevicesTimeout = undefined

		if (this._updateDevicesIsRunning) {
			this._triggerUpdateDevicesCheckAgain = true
			return
		}
		this._updateDevicesIsRunning = true

		// Defer:
		setTimeout(() => {
			this._updateDevices()

				.catch(() => {
					if (this._triggerUpdateDevicesCheckAgain)
						this.log.error('triggerUpdateDevices from updateDevices promise rejected')
				})
				.finally(() => {
					this._updateDevicesIsRunning = false
					if (!this._triggerUpdateDevicesCheckAgain) {
						return
					}
					if (this._triggerUpdateDevicesTimeout) {
						clearTimeout(this._triggerUpdateDevicesTimeout)
					}
					this._triggerUpdateDevicesTimeout = setTimeout(() => this.triggerUpdateDevices(), 1000)
					this._triggerUpdateDevicesCheckAgain = false
				})
		}, 10)
	}

	private async _updateDevices(): Promise<void> {
		// Added/updated:
		const deviceOptions = this.deviceOptions
		for (const [deviceId, newDevice] of deviceOptions.entries()) {
			if (newDevice.disable) continue

			const existingDevice = this.devices.get(deviceId)

			if (!existingDevice || !_.isEqual(existingDevice, newDevice)) {
				if (existingDevice) {
					await this.conductor.removeDevice(unprotectString(deviceId))
				}

				this.devices.set(deviceId, newDevice)
				this.onDeviceStatus(deviceId, {
					statusCode: StatusCode.UNKNOWN,
					messages: ['Initializing'],
					active: false,
				})

				// Run async so as not to block other devices from being processed.
				;(async () => {
					this.sideLoadDevice(deviceId, newDevice)

					// Create the device, but don't initialize it:
					const devicePr = this.conductor.createDevice(unprotectString(deviceId), newDevice)

					this.onDeviceStatus(deviceId, {
						active: true,
						statusCode: StatusCode.BAD,
						messages: ['Starting up'],
					})

					const device = await devicePr

					await device.device.on('connectionChanged', (...args) => {
						// TODO: figure out why the arguments to this event callback lost the correct typings
						const status = args[0] as DeviceStatus
						this.onDeviceStatus(deviceId, status)
					})
					// await device.device.on('commandError', onCommandError)
					// await device.device.on('info', (e: any, ...args: any[]) => this.logger.info(fixError(e), ...args))
					// await device.device.on('warning', (e: any, ...args: any[]) => this.logger.warn(fixError(e), ...args))
					// await device.device.on('error', (e: any, ...args: any[]) => this.logger.error(fixError(e), ...args))
					// await device.device.on('error', (e: any, ...args: any[]) => this.logger.error(fixError(e), ...args))

					device.onChildClose = () => {
						// Called if a child is closed / crashed
						this.log.warn(`Child of device ${deviceId} closed/crashed`)

						this.onDeviceStatus(deviceId, {
							active: true,
							statusCode: StatusCode.BAD,
							messages: ['Child process closed'],
						})

						this._removeDevice(deviceId).then(
							() => this.triggerUpdateDevices(),
							() => this.triggerUpdateDevices()
						)
					}

					await device.device.on('debug', (...args: any[]) => {
						const data = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
						this.log.debug(`Device "${device.deviceName || deviceId}" (${device.instanceId})`, { data })
					})

					// now initialize it
					await this.conductor.initDevice(unprotectString(deviceId), newDevice)

					this.onDeviceStatus(deviceId, await device.device.getStatus())
				})().catch((error) => this.log.error('TSR device error: ' + stringifyError(error)))
			}
		}
		// Removed:
		for (const deviceId of this.devices.keys()) {
			const newDevice = deviceOptions.get(deviceId)
			if (!newDevice || newDevice.disable) {
				await this._removeDevice(deviceId)

				this.reportRemovedDevice(deviceId)
				this.log.info(`TSR Device ${deviceId} removed.`)
			}
		}

		this.newConnection = false
	}
	private async _removeDevice(deviceId: TSRDeviceId): Promise<void> {
		// Delete the sideloaded device, if any
		const sideLoadedDevice = this.sideLoadedDevices.get(deviceId)
		if (sideLoadedDevice) {
			await sideLoadedDevice.close()
			this.sideLoadedDevices.delete(deviceId)
		}

		// HACK: There are some scenarios in which this method will never return.
		// For example, when trying to remove a CasparCG device that has never connected.
		// So, to prevent this code from being blocked indefinitely waiting for this promise
		// to resolve, we instead let it run async.
		this.conductor.removeDevice(unprotectString(deviceId)).catch((e) => this.log.error(stringifyError(e)))

		this.devices.delete(deviceId)
		this.deviceStatus.delete(deviceId)
	}
	public refreshResourcesAndMetadata(
		cb: (deviceId: TSRDeviceId, resources: ResourceAny[], metadata: MetadataAny) => void
	): void {
		for (const [deviceId, sideload] of this.sideLoadedDevices.entries()) {
			let timedOut = false
			this.send({
				type: 'DeviceRefreshStatus',
				deviceId,
				refreshing: true,
			})

			const refreshTimeout = setTimeout(() => {
				timedOut = true
				this.send({
					type: 'DeviceRefreshStatus',
					deviceId,
					refreshing: false,
				})
			}, 10 * 1000)

			sideload
				.refreshResourcesAndMetadata()
				.then((resourcesAndMetadata) => {
					cb(deviceId, resourcesAndMetadata.resources, resourcesAndMetadata.metadata)
				})
				.catch((e) => this.log.error(stringifyError(e)))
				.finally(() => {
					clearTimeout(refreshTimeout)
					if (!timedOut) {
						this.send({
							type: 'DeviceRefreshStatus',
							deviceId,
							refreshing: false,
						})
					}
				})
		}
	}
	public reportAllStatuses(): void {
		for (const deviceId of this.deviceStatus.keys()) {
			this.reportDeviceStatus(deviceId)
		}
	}
	private sideLoadDevice(deviceId: TSRDeviceId, deviceOptions: DeviceOptionsAny) {
		// So yeah, this is a hack, ideally we should be able to get references
		// to the devices out of TSR, but hit will do for now...

		const existingDevice = this.sideLoadedDevices.get(deviceId)
		if (existingDevice) {
			return
		}

		if (deviceOptions.type === DeviceType.CASPARCG) {
			this.sideLoadedDevices.set(deviceId, new CasparCGSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.ATEM) {
			this.sideLoadedDevices.set(deviceId, new AtemSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.OBS) {
			this.sideLoadedDevices.set(deviceId, new OBSSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.VMIX) {
			this.sideLoadedDevices.set(deviceId, new VMixSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.OSC) {
			this.sideLoadedDevices.set(deviceId, new OSCSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.HTTPSEND) {
			this.sideLoadedDevices.set(deviceId, new HTTPSendSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.HYPERDECK) {
			this.sideLoadedDevices.set(deviceId, new HyperdeckSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.TCPSEND) {
			this.sideLoadedDevices.set(deviceId, new TCPSendSideload(deviceId, deviceOptions, this.log))
		} else if (deviceOptions.type === DeviceType.TRICASTER) {
			this.sideLoadedDevices.set(deviceId, new TriCasterSideload(deviceId, deviceOptions, this.log))
		}
	}
	private onDeviceStatus(deviceId: TSRDeviceId, status: DeviceStatus) {
		this.deviceStatus.set(deviceId, status)

		this.reportDeviceStatus(deviceId)
	}
	private reportDeviceStatus(deviceId: TSRDeviceId) {
		const status = this.deviceStatus.get(deviceId)
		const device = this.devices.get(deviceId)

		if (status && device) {
			// Hack to get rid of warnings for UDP OSC devices, which always have an UNKNOWN status code.
			const isOscUdp = device.type === DeviceType.OSC && device.options?.type === OSCDeviceType.UDP
			const ok = isOscUdp ? true : status.statusCode === StatusCode.GOOD
			const message = status.messages?.join(', ') ?? ''
			this.send({
				type: 'deviceStatus',
				deviceId,
				ok,
				message,
			})
		}
	}
	private reportRemovedDevice(deviceId: TSRDeviceId) {
		this.send({
			type: 'deviceRemoved',
			deviceId,
		})
	}
}

enum StatusCode {
	/** Unknown status, could be due to parent device connected etc.. */
	UNKNOWN = 0,
	/** All good and green */
	GOOD = 1,
	/** Everything is not OK, but normal operation should not be affected. An optional/backup service might be offline, etc. */
	WARNING_MINOR = 2,
	/** Everything is not OK, operation might be affected. Like when having switched to a backup, or have taken action to fix an error. Sofie will show a restart device button for this and all higher severity warnings. */
	WARNING_MAJOR = 3,
	/** Not good. Operation is affected. Will be able to recover on it's own when the situation changes. */
	BAD = 4,
	/** Not good. Operation is affected. Will NOT be able to to recover from this, manual intervention will be required. */
	FATAL = 5,
}
interface DeviceStatus {
	statusCode: StatusCode
	messages?: Array<string>
	active: boolean
}
