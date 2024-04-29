import { flow, makeAutoObservable } from 'mobx'
import { ApiClient } from '../api/ApiClient'
import { ClientSideLogger } from '../api/logger'
import { ExtensionData, ExtensionManifest, ExtensionName } from 'src/models/GUI/Extension'
import { ActivateExtensionMessage } from 'src/models/GUI/ExtensionHostMessage'

export class ExtensionsStore {
	private serverAPI = new ApiClient()
	private extensionHostWorker: Worker
	private extensions: Map<
		ExtensionName,
		{
			name: ExtensionName
			manifest: ExtensionManifest
			url: string
		}
	> = new Map()

	logger: ClientSideLogger

	constructor() {
		makeAutoObservable(this)

		this.serverAPI = new ApiClient()
		this.logger = new ClientSideLogger(this.serverAPI)
		this.extensionHostWorker = new Worker(new URL('http://localhost:9124/extensionHost/worker.js'), {
			type: 'module',
		})
	}

	init = flow(function* (this: ExtensionsStore) {
		const extensions = (yield this.serverAPI.getAllExtensions()) as ExtensionData[]
		for (const extension of extensions) {
			this.onExtensionAdded(extension.name, extension.manifest, extension.url)
		}
	})

	private onExtensionAdded = (name: ExtensionName, manifest: ExtensionManifest, url: string) => {
		this.extensions.set(name, {
			name,
			manifest,
			url,
		})
		this.logger.info(name, manifest, url)

		const activateMsg: ActivateExtensionMessage = {
			type: 'activateExtension',
			name,
			manifest,
			url,
		}
		this.extensionHostWorker.postMessage(activateMsg)
	}

	private onExtensionRemoved = (name: ExtensionName) => {
		this.extensions.delete(name)
	}
}
