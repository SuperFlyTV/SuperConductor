import { makeAutoObservable, runInAction } from 'mobx'
import { SchemaValidator, setupSchemaValidator, ValidatorCache } from 'graphics-data-definition'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')

export class GDDValidatorStore {
	private isInitialized = false

	// private gddCache: ValidatorCache | null | undefined = undefined
	public gddValidator: SchemaValidator | null = null
	private serverAPI: IPCServer | null = null

	constructor() {
		makeAutoObservable(this)
	}

	async initializeGDDSchemaValidator(): Promise<void> {
		if (this.isInitialized) return

		this.isInitialized = true
		if (!this.serverAPI) this.serverAPI = new IPCServer(ipcRenderer)

		// First, retrieve a cache from server, if possible:
		let gddCache = await this.serverAPI.fetchGDDCache()

		try {
			const v = await setupSchemaValidator({
				fetch: async (url: string) => {
					const response = await fetch(url)
					return await response.json()
				},
				getCache: async (): Promise<ValidatorCache> => {
					return gddCache ?? {}
				},
			})
			gddCache = v.cache
			runInAction(() => {
				this.gddValidator = v.validate
			})
		} catch (e) {
			;(window as any).handleError
		}

		// Store the cache:
		if (gddCache) {
			await this.serverAPI.storeGDDCache({ cache: gddCache })
		}
	}
}
