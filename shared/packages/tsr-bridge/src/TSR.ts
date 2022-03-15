import _ from 'lodash'
import winston from 'winston'
import { Conductor, ConductorOptions, DeviceOptionsAny, DeviceType } from 'timeline-state-resolver'
import { CasparCG } from 'casparcg-connection'
import { Atem, AtemConnectionStatus } from 'atem-connection'
import { ResourceAny, ResourceType, AtemMe, CasparCGMedia, CasparCGTemplate } from '@shared/models'
import { BridgeAPI } from '@shared/api'

export class TSR {
	public newConnection = false
	public conductor: Conductor
	public send: (message: BridgeAPI.FromBridge.Any) => void
	private devices: { [deviceId: string]: DeviceOptionsAny } = {}

	private sideLoadedDevices: {
		[deviceId: string]: {
			refreshResources: () => Promise<ResourceAny[]>
			close: () => Promise<void>
		}
	} = {}
	private currentTimeDiff = 0
	private deviceStatus: { [deviceId: string]: DeviceStatus } = {}

	constructor(private log?: winston.Logger | Console) {
		const c: ConductorOptions = {
			getCurrentTime: () => this.getCurrentTime(),
			initializeAsClear: true,
			multiThreadedResolver: false,
			proActiveResolve: true,
		}
		this.conductor = new Conductor(c)

		this.conductor.on('error', (e, ...args) => {
			log?.error('TSR', e, ...args)
		})
		this.conductor.on('info', (msg, ...args) => {
			log?.info('TSR', msg, ...args)
		})
		this.conductor.on('warning', (msg, ...args) => {
			log?.warn('Warning: TSR', msg, ...args)
		})

		this.conductor.setTimelineAndMappings([], undefined)
		this.conductor.init().catch((e) => log?.error(e))

		this.send = () => {
			throw new Error('TSR.send() not set!')
		}
	}
	/**
	 * Syncs the currentTime, this is useful when TSR-Bridge runs on another computer than SuperConductor,
	 * where the local time might differ from the SuperConductor.
	 */
	public setCurrentTime(currentTime: number) {
		if (currentTime) this.currentTimeDiff = currentTime - Date.now()
	}
	public getCurrentTime(): number {
		return Date.now() + this.currentTimeDiff
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

				this.devices[deviceId] = newDevice
				this.onDeviceStatus(deviceId, {
					statusCode: StatusCode.UNKNOWN,
					messages: ['Initializing'],
					active: false,
				})

				// Run async so as not to block other devices from being processed.
				;(async () => {
					this.sideLoadDevice(deviceId, newDevice)

					// Create the device, but don't initialize it:
					const device = await this.conductor.createDevice(deviceId, newDevice)

					await device.device.on('connectionChanged', (status: DeviceStatus) => {
						this.onDeviceStatus(deviceId, status)
					})
					// await device.device.on('commandError', onCommandError)
					// await device.device.on('info', (e: any, ...args: any[]) => this.logger.info(fixError(e), ...args))
					// await device.device.on('warning', (e: any, ...args: any[]) => this.logger.warn(fixError(e), ...args))
					// await device.device.on('error', (e: any, ...args: any[]) => this.logger.error(fixError(e), ...args))

					// now initialize it
					await this.conductor.initDevice(deviceId, newDevice)

					this.onDeviceStatus(deviceId, await device.device.getStatus())
				})().catch((error) => this.log?.error(error))
			}
		}
		// Removed:
		for (const deviceId in this.devices) {
			if (!newDevices[deviceId]) {
				// Delete the sideloaded device, if any
				if (deviceId in this.sideLoadedDevices) {
					await this.sideLoadedDevices[deviceId].close()
					delete this.sideLoadedDevices[deviceId]
				}

				await this.conductor.removeDevice(deviceId)
				delete this.devices[deviceId]
				delete this.deviceStatus[deviceId]
				this.reportRemovedDevice(deviceId)
				this.log?.info(`TSR Device ${deviceId} removed.`)
			}
		}

		this.newConnection = false
	}
	public refreshResources(cb: (deviceId: string, resources: ResourceAny[]) => void) {
		for (const [deviceId, sideload] of Object.entries(this.sideLoadedDevices)) {
			sideload
				.refreshResources()
				.then((resources) => {
					cb(deviceId, resources)
				})
				.catch((e) => this.log?.error(e))
		}
	}
	public reportAllStatuses() {
		for (const deviceId of Object.keys(this.deviceStatus)) {
			this.reportDeviceStatus(deviceId)
		}
	}
	private sideLoadDevice(deviceId: string, deviceOptions: DeviceOptionsAny) {
		// So yeah, this is a hack, ideally we should be able to get references
		// to the devices out of TSR, but hit will do for now...

		const existingDevice = this.sideLoadedDevices[deviceId]
		if (existingDevice) {
			return
		}

		if (deviceOptions.type === DeviceType.CASPARCG) {
			const ccg = new CasparCG({
				host: deviceOptions.options?.host,
				port: deviceOptions.options?.port,
				autoConnect: true,
				onConnected: async () => {
					this.log?.info(`CasparCG ${deviceId}: Sideload connection initialized`)
					// this.fetchAndSetMedia()
					// this.fetchAndSetTemplates()
				},
				onConnectionChanged: () => {
					// console.log('CasparCG: Connection changed')
				},
				onDisconnected: () => {
					this.log?.info(`CasparCG ${deviceId}: Sideload connection disconnected`)
				},
			})

			const refreshResources = async () => {
				const resources: { [id: string]: ResourceAny } = {}

				if (!ccg.connected) {
					return Object.values(resources)
				}

				// Refresh media:
				{
					const res = await ccg.cls()
					const mediaList = res.response.data as {
						type: 'image' | 'video' | 'audio'
						name: string
						size: number
						changed: number
						frames: number
						frameTime: string
						frameRate: number
						duration: number
						thumbnail?: string
					}[]
					for (const media of mediaList) {
						const resource: CasparCGMedia = {
							resourceType: ResourceType.CASPARCG_MEDIA,
							deviceId: deviceId,
							id: media.name,
							...media,
						}

						if (media.type === 'image' || media.type === 'video') {
							try {
								const thumbnail = await ccg.thumbnailRetrieve(media.name)
								resource.thumbnail = thumbnail.response.data
							} catch (error) {
								// console.error(`Could not set thumbnail for media "${media.name}".`, error)
								this.log?.error(`Could not set thumbnail for media "${media.name}".`)
							}
						}

						const id = `${resource.deviceId}_${resource.id}`
						resources[id] = resource
					}
				}

				// Refresh templates:
				{
					const res = await ccg.tls()
					const templatesList = res.response.data as {
						type: 'template'
						name: string
					}[]
					for (const template of templatesList) {
						const resource: CasparCGTemplate = {
							resourceType: ResourceType.CASPARCG_TEMPLATE,
							deviceId: deviceId,
							id: template.name,
							...template,
						}
						const id = `${resource.deviceId}_${resource.id}`
						resources[id] = resource
					}
				}

				return Object.values(resources)
			}

			this.sideLoadedDevices[deviceId] = {
				refreshResources: () => {
					return refreshResources()
				},
				close: async () => {
					return ccg.disconnect()
				},
			}

			// new CasparCGDevice(deviceOptions)
		} else if (deviceOptions.type === DeviceType.ATEM) {
			const atem = new Atem()

			atem.on('connected', () => {
				this.log?.info(`ATEM ${deviceId}: Sideload connection initialized`)
			})

			atem.on('disconnected', () => {
				this.log?.info(`ATEM ${deviceId}: Sideload connection disconnected`)
			})

			if (deviceOptions.options?.host) {
				atem.connect(deviceOptions.options.host, deviceOptions.options?.port).catch(console.error)
			}

			const refreshResources = async () => {
				const resources: { [id: string]: ResourceAny } = {}

				if (atem.status !== AtemConnectionStatus.CONNECTED || !atem.state) {
					return Object.values(resources)
				}

				for (const me of atem.state.video.mixEffects) {
					if (!me) {
						continue
					}
					const resource: AtemMe = {
						resourceType: ResourceType.ATEM_ME,
						deviceId,
						id: `me_${me.index}`,
						index: me.index,
						name: `ATEM ME ${me.index + 1}`,
					}
					const id = `${resource.deviceId}_${resource.id}`
					resources[id] = resource
				}

				return Object.values(resources)
			}

			this.sideLoadedDevices[deviceId] = {
				refreshResources: () => {
					return refreshResources()
				},
				close: () => {
					return atem.destroy()
				},
			}
		}
	}
	private onDeviceStatus(deviceId: string, status: DeviceStatus) {
		this.deviceStatus[deviceId] = status

		this.reportDeviceStatus(deviceId)
	}
	private reportDeviceStatus(deviceId: string) {
		const status = this.deviceStatus[deviceId]

		if (status && this.devices[deviceId]) {
			const ok = status.statusCode === StatusCode.GOOD
			const message = status.messages?.join(', ') ?? ''
			this.send({
				type: 'deviceStatus',
				deviceId,
				ok,
				message,
			})
		}
	}
	private reportRemovedDevice(deviceId: string) {
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
