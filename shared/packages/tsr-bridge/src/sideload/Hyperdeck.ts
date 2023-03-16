import { DeviceOptionsHyperdeck } from 'timeline-state-resolver'
import { Hyperdeck, Commands } from 'hyperdeck-connection'
import {
	ResourceAny,
	ResourceType,
	HyperdeckPlay,
	HyperdeckRecord,
	HyperdeckPreview,
	HyperdeckClip,
	HyperdeckMetadata,
	MetadataAny,
	MetadataType,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { stringifyError } from '@shared/lib'

export class HyperdeckSideload implements SideLoadDevice {
	private hyperdeck: Hyperdeck
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: { [id: string]: ResourceAny } = {}
	private cacheMetadata: HyperdeckMetadata = { metadataType: MetadataType.HYPERDECK }

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
		const resources: { [id: string]: ResourceAny } = {}
		const metadata: HyperdeckMetadata = { metadataType: MetadataType.HYPERDECK }

		if (!this.hyperdeck.connected) {
			return {
				resources: Object.values(this.cacheResources),
				metadata: this.cacheMetadata,
			}
		}

		// Play command
		{
			const resource: HyperdeckPlay = {
				resourceType: ResourceType.HYPERDECK_PLAY,
				deviceId: this.deviceId,
				id: `${this.deviceId}_hyperdeck_play`,
				displayName: 'HyperDeck Play',
			}
			resources[resource.id] = resource
		}

		// Record command
		{
			const resource: HyperdeckRecord = {
				resourceType: ResourceType.HYPERDECK_RECORD,
				deviceId: this.deviceId,
				id: `${this.deviceId}_hyperdeck_record`,
				displayName: 'HyperDeck Record',
			}
			resources[resource.id] = resource
		}

		// Preview command
		{
			const resource: HyperdeckPreview = {
				resourceType: ResourceType.HYPERDECK_PREVIEW,
				deviceId: this.deviceId,
				id: `${this.deviceId}_hyperdeck_preview`,
				displayName: 'HyperDeck Preview',
			}
			resources[resource.id] = resource
		}

		// Enumerate clips
		{
			const res: Commands.DiskListCommandResponse = await this.hyperdeck.sendCommand(
				new Commands.DiskListCommand()
			)

			for (const clip of res.clips) {
				const resource: HyperdeckClip = {
					resourceType: ResourceType.HYPERDECK_CLIP,
					deviceId: this.deviceId,
					id: `${this.deviceId}_hyperdeck_clip_${clip.clipId}_${clip.name}`,
					displayName: `Clip ${clip.clipId} - ${clip.name}`,
					slotId: res.slotId,
					clipId: parseInt(clip.clipId, 10),
					clipName: clip.name,
				}
				resources[resource.id] = resource
			}
		}

		this.cacheResources = resources
		this.cacheMetadata = metadata
		return {
			resources: Object.values(resources),
			metadata,
		}
	}
}
