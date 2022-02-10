import * as _ from 'underscore'
import { Conductor, ConductorOptions, DeviceOptionsAny, DeviceType } from 'timeline-state-resolver'
import { CasparCG } from 'casparcg-connection'
import { ResourceAny, ResourceType, CasparCGMedia, CasparCGTemplate } from '@shared/models'
import { BridgeAPI } from '@shared/api'

export class TSR {
	public newConnection = false
	public conductor: Conductor
	private devices: { [deviceId: string]: DeviceOptionsAny } = {}

	private sideLoadedDevices: {
		[deviceId: string]: {
			refreshResources: () => Promise<ResourceAny[]>
		}
	} = {}
	private currentTimeDiff = 0

	constructor() {
		const c: ConductorOptions = {
			getCurrentTime: () => this.getCurrentTime(),
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
	/**
	 * Syncs the currentTime, this is useful when TSR-bridge runs on another computer than SuperConductor,
	 * where the local time might differ from the SuperConductor.
	 */
	public setCurrentTime(currentTime: number) {
		if (currentTime) this.currentTimeDiff = currentTime - Date.now()
	}
	public getCurrentTime(): number {
		return Date.now() + this.currentTimeDiff
	}

	public async updateDevices(
		newDevices: { [deviceId: string]: DeviceOptionsAny },
		send: (message: BridgeAPI.FromBridge.Any) => void
	) {
		console.log('updateDevices', newDevices)
		// Added/updated:
		for (const deviceId in newDevices) {
			const newDevice = newDevices[deviceId]
			const existingDevice = this.devices[deviceId]

			let updated = false

			if (!existingDevice || !_.isEqual(existingDevice, newDevice)) {
				if (existingDevice) {
					await this.conductor.removeDevice(deviceId)
				}

				const device = await this.conductor.addDevice(deviceId, newDevice)
				await device.device.on('connectionChanged', (status: any) => {
					console.log('connectionChanged')
					const ok = status.statusCode === StatusCode.GOOD
					const message = status.messages.join(', ')

					send({
						type: 'deviceStatus',
						deviceId,
						ok,
						message,
					})
				})
				updated = true

				this.sideLoadDevice(deviceId, newDevice)
				this.devices[deviceId] = newDevice
			}
			if (updated || this.newConnection) {
				// Send initial status:
				send({
					type: 'deviceStatus',
					deviceId,
					ok: true,
					message: '',
				})
			}
		}
		// Removed:
		for (const deviceId in this.devices) {
			if (!newDevices[deviceId]) {
				await this.conductor.removeDevice(deviceId)
				delete this.devices[deviceId]
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
				.catch(console.error)
		}
	}
	private sideLoadDevice(deviceId: string, deviceOptions: DeviceOptionsAny) {
		// So yeah, this is a hack, ideally we should be able to get references
		// to the devices out of TSR, but hit will do for now...

		const existingDevice = this.sideLoadedDevices[deviceId]

		if (!existingDevice) {
			if (deviceOptions.type === DeviceType.CASPARCG) {
				const ccg = new CasparCG({
					host: deviceOptions.options?.host,
					port: deviceOptions.options?.port,
					autoConnect: true,
					onConnected: async () => {
						console.log('CasparCG: Connection initialized')
						// this.fetchAndSetMedia()
						// this.fetchAndSetTemplates()
					},
					onConnectionChanged: () => {
						// console.log('CasparCG: Connection changed')
					},
					onDisconnected: () => {
						// console.log('CasparCG: Connection disconnected')
					},
				})

				const refreshResources = async () => {
					const resources: { [id: string]: ResourceAny } = {}

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
									console.error(`Could not set thumbnail for media "${media.name}".`, error)
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
				}

				// new CasparCGDevice(deviceOptions)
			}
		}
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
