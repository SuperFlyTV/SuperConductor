import { findMedia } from '@/lib/util'
import { AppModel } from '@/models/AppModel'
import { MediaModel } from '@/models/MediaModel'
import { TemplateModel } from '@/models/TemplateModel'
import { CasparCG } from 'casparcg-connection'

export class TPTCasparCG {
	private _appDataRef: AppModel
	private _updateViewRef: () => void
	ccg: CasparCG | null = null

	constructor(appData: AppModel, updateViewRef: () => void) {
		this._appDataRef = appData
		this._updateViewRef = updateViewRef

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
			const mediaList = res.response.data as MediaModel[]
			this._appDataRef.media = mediaList
			await this.fetchAndSetThumbnails()
			this._updateViewRef()
		} catch (error) {
			console.error('Could not fetch media', error)
		}
	}

	async fetchAndSetTemplates() {
		if (!this.ccg) return
		try {
			const res = await this.ccg.tls()
			const templatesList = res.response.data as TemplateModel[]
			this._appDataRef.templates = templatesList
			this._updateViewRef()
		} catch (error) {
			console.error('Could not fetch templates', error)
		}
	}

	async fetchAndSetThumbnails() {
		if (!this.ccg) return
		try {
			// const thumbGenAllRes = await this.ccg.thumbnailGenerateAll()

			const listRes = await this.ccg.thumbnailList()
			const listData = listRes.response.data as { name: string }[]

			for (const kv in listData) {
				const thumbnailName = listData[kv].name

				if (!this.ccg) return
				const singleRes = await this.ccg.thumbnailRetrieve(thumbnailName)
				const singleData = singleRes.response.data

				const foundMedia = findMedia(this._appDataRef.media, thumbnailName)
				if (!foundMedia) {
					console.error(`Could not set thumbnail for media "${thumbnailName}". Media not found.`)
					return
				}
				foundMedia.thumbnail = singleData
			}
		} catch (error) {
			console.error('Could not fetch media', error)
		}
	}
}
