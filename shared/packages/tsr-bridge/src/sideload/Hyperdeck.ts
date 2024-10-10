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
	protectString,
	HyperdeckMetadata,
	MetadataAny,
	MetadataType,
	TSRDeviceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload.js'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource, stringifyError } from '@shared/lib'

export class HyperdeckSideload implements SideLoadDevice {
	private hyperdeck: Hyperdeck
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()
	private cacheMetadata: HyperdeckMetadata = { metadataType: MetadataType.HYPERDECK }

	constructor(private deviceId: TSRDeviceId, private deviceOptions: DeviceOptionsHyperdeck, private log: LoggerLike) {
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
	public async refreshResourcesAndMetadata(): Promise<{
		resources: ResourceAny[]
		metadata: MetadataAny
	}> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		this.hyperdeck.removeAllListeners()
		return this.hyperdeck.disconnect()
	}
	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: HyperdeckMetadata = { metadataType: MetadataType.HYPERDECK }

		if (!this.hyperdeck.connected) {
			return {
				resources: Array.from(this.cacheResources.values()),
				metadata: this.cacheMetadata,
			}
		}

		// Play command
		{
			const resource: HyperdeckPlay = {
				resourceType: ResourceType.HYPERDECK_PLAY,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'HyperDeck Play',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Record command
		{
			const resource: HyperdeckRecord = {
				resourceType: ResourceType.HYPERDECK_RECORD,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'HyperDeck Record',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Preview command
		{
			const resource: HyperdeckPreview = {
				resourceType: ResourceType.HYPERDECK_PREVIEW,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'HyperDeck Preview',
			}
			resource.id = getResourceIdFromResource(resource)
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
					id: protectString(''), // set by getResourceIdFromResource() later
					displayName: `Clip ${clip.clipId} - ${clip.name}`,
					slotId: res.slotId,
					clipId: parseInt(clip.clipId, 10),
					clipName: clip.name,
				}
				resource.id = getResourceIdFromResource(resource)
				resources.set(resource.id, resource)
			}
		}

		this.cacheResources = resources
		this.cacheMetadata = metadata
		return {
			resources: Array.from(resources.values()),
			metadata,
		}
	}
}
