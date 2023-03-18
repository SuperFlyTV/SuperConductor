import { DeviceOptionsHyperdeck } from 'timeline-state-resolver'
import { Hyperdeck, Commands } from 'hyperdeck-connection'
import {
	ResourceAny,
	ResourceType,
	HyperdeckPlay,
	HyperdeckRecord,
	HyperdeckPreview,
	HyperdeckClip,
	ResourceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { generateResourceId, stringifyError } from '@shared/lib'

export class HyperdeckSideload implements SideLoadDevice {
	private hyperdeck: Hyperdeck
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsHyperdeck, private log: LoggerLike) {
		this.hyperdeck = new Hyperdeck()

		this.hyperdeck.on('connected', () => {
			this.log.info(`HyperDeck ${deviceId}: Sideload connection initialized`)
		})

		this.hyperdeck.on('disconnected', () => {
			this.log.info(`HyperDeck ${deviceId}: Sideload connection disconnected`)
		})

		this.hyperdeck.on('error', (error) => {
			this.log.error(`HyperDeck ${deviceId}: ${stringifyError(error)}`)
		})

		if (deviceOptions.options?.host) {
			this.hyperdeck.connect(deviceOptions.options.host, deviceOptions.options?.port)
		}
	}
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		this.hyperdeck.removeAllListeners()
		return this.hyperdeck.disconnect()
	}
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

		if (!this.hyperdeck.connected) {
			return Array.from(this.cacheResources.values())
		}

		// Play command
		{
			const resource: HyperdeckPlay = {
				resourceType: ResourceType.HYPERDECK_PLAY,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.HYPERDECK_PLAY, 0),
				displayName: 'HyperDeck Play',
			}
			resources.set(resource.id, resource)
		}

		// Record command
		{
			const resource: HyperdeckRecord = {
				resourceType: ResourceType.HYPERDECK_RECORD,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.HYPERDECK_RECORD, 0),
				displayName: 'HyperDeck Record',
			}
			resources.set(resource.id, resource)
		}

		// Preview command
		{
			const resource: HyperdeckPreview = {
				resourceType: ResourceType.HYPERDECK_PREVIEW,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.HYPERDECK_PREVIEW, 0),
				displayName: 'HyperDeck Preview',
			}
			resources.set(resource.id, resource)
		}

		// Enumerate clips
		// TODO: replace this with the "Device Metadata" system, like how we do ATEM Inputs.
		// This will be kind of broken until then.
		{
			const res: Commands.DiskListCommandResponse = await this.hyperdeck.sendCommand(
				new Commands.DiskListCommand()
			)

			for (const clip of res.clips) {
				const resource: HyperdeckClip = {
					resourceType: ResourceType.HYPERDECK_CLIP,
					deviceId: this.deviceId,
					id: generateResourceId(this.deviceId, ResourceType.HYPERDECK_CLIP, `${clip.clipId}_${clip.name}`),
					displayName: `Clip ${clip.clipId} - ${clip.name}`,
					slotId: res.slotId,
					clipId: parseInt(clip.clipId, 10),
					clipName: clip.name,
				}
				resources.set(resource.id, resource)
			}
		}

		this.cacheResources = resources
		return Array.from(resources.values())
	}
}
