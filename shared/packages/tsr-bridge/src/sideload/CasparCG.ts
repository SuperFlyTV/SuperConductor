import { DeviceOptionsCasparCG } from 'timeline-state-resolver'
import { CasparCG, ClipInfo, Response } from 'casparcg-connection'
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
import { SideLoadDevice } from './sideload.js'
import { LoggerLike } from '@shared/api'
import {
	addTemplatesToResourcesFromCasparCG,
	addTemplatesToResourcesFromCasparCGMediaScanner,
	addTemplatesToResourcesFromDisk,
} from './CasparCGTemplates.js'
import { assertNever, getResourceIdFromResource } from '@shared/lib'

export class CasparCGSideload implements SideLoadDevice {
	private ccg: CasparCG
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()
	private cacheMetadata: CasparCGMetadata = { metadataType: MetadataType.CASPARCG }

	constructor(
		private deviceId: TSRDeviceId,
		private deviceOptions: DeviceOptionsCasparCG,
		private log: LoggerLike
	) {
		this.ccg = new CasparCG({
			host: this.deviceOptions.options?.host,
			port: this.deviceOptions.options?.port,
			autoConnect: true,
		})
		this.ccg.on('connect', () => {
			this.log.info(`CasparCG ${this.deviceId}: Sideload connection initialized`)
		})
		this.ccg.on('disconnect', () => {
			this.log.info(`CasparCG ${this.deviceId}: Sideload connection disconnected`)
		})
		this.ccg.on('error', (error) => {
			this.log.info(`CasparCG Error: ${error}`)
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
			let mediaList: ClipInfo[] = []

			const res = await this.ccg.cls()
			if (res.error) throw res.error

			const response = await res.request
			if (this._isSuccessful(response)) {
				mediaList = response.data
			} else if (response.responseCode !== 501) {
				// This probably means it's something other than media-scanner not running
				this.log.error(`Could not get media list. Received response:`, response.responseCode, response.message)
			}

			for (const media of mediaList) {
				if (media.clip.startsWith('__')) {
					// Ignore these
					continue
				}

				let type: CasparCGMedia['type']
				if (media.type === 'STILL') {
					type = 'image'
				} else if (media.type === 'MOVIE') {
					type = 'video'
				} else if (media.type === 'AUDIO') {
					type = 'audio'
				} else {
					assertNever(media.type)
					type = 'video'
				}

				const resource: CasparCGMedia = {
					resourceType: ResourceType.CASPARCG_MEDIA,
					deviceId: this.deviceId,
					id: protectString(''), // set by getResourceIdFromResource() later
					type,
					name: media.clip,
					displayName: media.clip,
					changed: media.datetime,
					duration: media.frames / media.framerate,
					frameRate: media.framerate,
					frames: media.frames,
					size: media.size,
					frameTime: '',
				}
				resource.id = getResourceIdFromResource(resource)

				if ((resource.type === 'image' || resource.type === 'video') && TMP_THUMBNAIL_LIMIT > 0) {
					try {
						const thumbnailQuery = await this.ccg.thumbnailRetrieve({ filename: resource.name })
						if (thumbnailQuery.error) throw thumbnailQuery.error

						const thumbnail = await thumbnailQuery.request
						if (this._isSuccessful(thumbnail)) {
							const thumbnailData =
								Array.isArray(thumbnail.data) && typeof thumbnail.data[0] === 'string'
									? thumbnail.data[0]
									: undefined
							resource.thumbnail = thumbnailData && this._toPngDataUri(thumbnailData)
							TMP_THUMBNAIL_LIMIT--
						} // else: probably CasparCG's media-scanner isn't running
					} catch (error) {
						this.log.error(`Could not set thumbnail for media "${resource.name}".`, error)
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

	private _isSuccessful<T>(response: Response<T>): boolean {
		return response.responseCode < 400 && response.data != null
	}

	private _toPngDataUri(imageBase64: string) {
		return `data:image/png;base64,${imageBase64}`
	}
}
