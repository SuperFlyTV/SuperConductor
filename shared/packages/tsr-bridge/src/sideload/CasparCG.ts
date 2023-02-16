import { DeviceOptionsCasparCG } from 'timeline-state-resolver'
import { CasparCG, AMCP, Config } from 'casparcg-connection'
import got from 'got'
import { ResourceAny, ResourceType, CasparCGMedia, CasparCGTemplate } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { literal } from '@shared/lib'
import {
	addTemplatesToResourcesFromCasparCG,
	addTemplatesToResourcesFromCasparCGMediaScanner,
	addTemplatesToResourcesFromDisk,
} from './CasparCGTemplates'

export class CasparCGSideload implements SideLoadDevice {
	private ccg: CasparCG
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: { [id: string]: ResourceAny } = {}

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsCasparCG, private log: LoggerLike) {
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
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		return this.ccg.disconnect()
	}

	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

		if (!this.ccg.connected) {
			return Object.values(this.cacheResources)
		}

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
					id: `${this.deviceId}_media_${media.name}`,
					...media,
					displayName: media.name,
				}

				if (media.type === 'image' || media.type === 'video') {
					try {
						const thumbnail = await this.ccg.thumbnailRetrieve(media.name)
						resource.thumbnail = thumbnail.response.data
					} catch (error) {
						if ((error as AMCP.ThumbnailRetrieveCommand)?.response?.code === 404) {
							// Suppress error, this is probably because CasparCG's media-scanner isn't running.
						} else {
							this.log.error(`Could not set thumbnail for media "${media.name}".`, error)
						}
					}
				}

				resources[resource.id] = resource
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
		return Object.values(resources)
	}
}
