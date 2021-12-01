import { CasparCGMedia, CasparCGTemplate } from '@/models/resource/CasparCG'
import { ResourceAny, ResourceType } from '@/models/resource/resource'
import { CasparCG } from 'casparcg-connection'
import _ from 'lodash'
import { SessionHandler } from './sessionHandler'

export class TPTCasparCG {
	ccg: CasparCG | null = null

	constructor(private session: SessionHandler, private deviceId: string) {
		this.initCasparCGConnection()
	}

	initCasparCGConnection() {
		this.ccg = new CasparCG({
			host: '127.0.0.1',
			port: 5250,
			autoConnect: true,
			onConnected: async () => {
				console.log('Connection initialized')
				this.fetchAndSetMedia()
				this.fetchAndSetTemplates()
			},
			onConnectionChanged: () => {
				console.log('Connection changed')
			},
			onDisconnected: () => {
				console.log('Connection disconnected')
			},
		})
	}

	async fetchAndSetMedia() {
		if (!this.ccg) return
		try {
			const res = await this.ccg.cls()
			const mediaList = res.response.data as {
				type: 'image' | 'video'
				name: string
				size: number
				changed: number
				frames: number
				frameTime: string
				frameRate: number
				duration: number
				thumbnail?: string
			}[]

			const resources: { [id: string]: ResourceAny } = {}
			for (const media of mediaList) {
				const resource: CasparCGMedia = {
					resourceType: ResourceType.CASPARCG_MEDIA,
					deviceId: this.deviceId,
					id: media.name,
					...media,
				}
				const id = `${resource.deviceId}_${resource.id}`
				resources[id] = resource
			}

			this._updateResources(resources)

			// await this.fetchAndSetThumbnails()
		} catch (error) {
			console.error('Could not fetch media', error)
		}
	}

	async fetchAndSetTemplates() {
		if (!this.ccg) return
		try {
			const res = await this.ccg.tls()
			const templatesList = res.response.data as {
				type: 'template'
				name: string
			}[]

			const resources: { [id: string]: ResourceAny } = {}
			for (const template of templatesList) {
				const resource: CasparCGTemplate = {
					resourceType: ResourceType.CASPARCG_TEMPLATE,
					deviceId: this.deviceId,
					id: template.name,
					...template,
				}
				const id = `${resource.deviceId}_${resource.id}`
				resources[id] = resource
			}

			this._updateResources(resources)
		} catch (error) {
			console.error('Could not fetch templates', error)
		}
	}
	private _updateResources(resources: { [id: string]: ResourceAny } = {}) {
		// Added/Updated:
		for (const [id, resource] of Object.entries(resources)) {
			if (!_.isEqual(this.session.getResource(id), resource)) {
				this.session.updateResource(id, resource)
			}
		}
		// Removed:
		for (const id of this.session.getResourceIds(this.deviceId)) {
			if (!resources[id]) this.session.updateResource(id, null)
		}
	}

	// async fetchAndSetThumbnails() {
	// 	if (!this.ccg) return
	// 	try {
	// 		// const thumbGenAllRes = await this.ccg.thumbnailGenerateAll()

	// 		const listRes = await this.ccg.thumbnailList()
	// 		const listData = listRes.response.data as { name: string }[]

	// 		for (const kv in listData) {
	// 			const thumbnailName = listData[kv].name

	// 			if (!this.ccg) return
	// 			const singleRes = await this.ccg.thumbnailRetrieve(thumbnailName)
	// 			const singleData = singleRes.response.data

	// 			const foundMedia = findMedia(this._appDataRef.media, thumbnailName)
	// 			if (!foundMedia) {
	// 				console.error(`Could not set thumbnail for media "${thumbnailName}". Media not found.`)
	// 				return
	// 			}
	// 			foundMedia.thumbnail = singleData
	// 		}
	// 	} catch (error) {
	// 		console.error('Could not fetch media', error)
	// 	}
	// }
}
