import { DeviceOptionsCasparCG } from 'timeline-state-resolver'
import { CasparCG, AMCP } from 'casparcg-connection'
import {
	ResourceAny,
	ResourceType,
	CasparCGMedia,
	ResourceId,
	protectString,
	MetadataAny,
	CasparCGMetadata,
	MetadataType,
	TSRDeviceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import {
	addTemplatesToResourcesFromCasparCG,
	addTemplatesToResourcesFromCasparCGMediaScanner,
	addTemplatesToResourcesFromDisk,
} from './CasparCGTemplates'
import { getResourceIdFromResource } from '@shared/lib'

export class CasparCGSideload implements SideLoadDevice {
	private ccg: CasparCG
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()
	private cacheMetadata: CasparCGMetadata = { metadataType: MetadataType.CASPARCG }

	constructor(private deviceId: TSRDeviceId, private deviceOptions: DeviceOptionsCasparCG, private log: LoggerLike) {
		this.ccg = new CasparCG({
			host: this.deviceOptions.options?.host,
			port: this.deviceOptions.options?.port,
			autoConnect: true,
			onConnected: (): void => {
				this.log.info(`CasparCG ${this.deviceId}: Sideload connection initialized`)
			},
			onDisconnected: (): void => {
				this.log.info(`CasparCG ${this.deviceId}: Sideload connection disconnected`)
			},
		})
	}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		return this.ccg.disconnect()
	}

	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: CasparCGMetadata = { metadataType: MetadataType.CASPARCG }

		if (!this.ccg.connected) {
			return {
				resources: Array.from(this.cacheResources.values()),
				metadata: this.cacheMetadata,
			}
		}

		// Temporary fix for when there are MANY items, to avoid out-of-memory when loading too many thumbnails..
		let TMP_THUMBNAIL_LIMIT = 500
		// Refresh media:
		{
			let mediaList: {
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
			try {
				const res = await this.ccg.cls()
				mediaList = res.response.data
			} catch (error) {
				if ((error as AMCP.ClsCommand)?.response?.code === 501) {
					// This probably means that media-scanner isn't running
					mediaList = []
				} else {
					throw error
				}
			}

			for (const media of mediaList) {
				if (media.name.startsWith('__')) {
					// Ignore these
					continue
				}

				const resource: CasparCGMedia = {
					resourceType: ResourceType.CASPARCG_MEDIA,
					deviceId: this.deviceId,
					id: protectString(''), // set by getResourceIdFromResource() later
					...media,
					displayName: media.name,
				}
				resource.id = getResourceIdFromResource(resource)

				if ((media.type === 'image' || media.type === 'video') && TMP_THUMBNAIL_LIMIT > 0) {
					try {
						const thumbnail = await this.ccg.thumbnailRetrieve(media.name)
						resource.thumbnail = thumbnail.response.data
						TMP_THUMBNAIL_LIMIT--
					} catch (error) {
						if ((error as AMCP.ThumbnailRetrieveCommand)?.response?.code === 404) {
							// Suppress error, this is probably because CasparCG's media-scanner isn't running.
						} else {
							this.log.error(`Could not set thumbnail for media "${media.name}".`, error)
						}
					}
				}

				resources.set(resource.id, resource)
			}
		}

		// Refresh templates:
		{
			await addTemplatesToResourcesFromCasparCG(resources, this.ccg, this.deviceId)

			// Also, do a separate query directly to the media scanner, to extract GDD-definitions if possible:
			// This is kind of a hack, until CasparCG supports GDD natively:
			const success = await addTemplatesToResourcesFromCasparCGMediaScanner(resources, this.ccg, this.deviceId)

			if (!success) {
				// Finally, try to read the files from disk directly:
				await addTemplatesToResourcesFromDisk(resources, this.ccg, this.deviceId)
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
