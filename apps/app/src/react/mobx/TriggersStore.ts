import { makeAutoObservable } from 'mobx'
import { ApiClient } from '../api/ApiClient.js'
import { RealtimeDataProvider } from '../api/RealtimeDataProvider.js'
import { ClientSideLogger } from '../api/logger.js'

export class TriggersStore {
	failedGlobalTriggers: Set<string> = new Set()

	serverAPI: ApiClient
	logger: ClientSideLogger
	ipcClient: RealtimeDataProvider

	constructor() {
		this.serverAPI = new ApiClient()
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new RealtimeDataProvider(this.logger, {
			updateFailedGlobalTriggers: (identifiers: string[]) => this.updateFailedGlobalTriggers(identifiers),
		})

		makeAutoObservable(this)
	}

	updateFailedGlobalTriggers(identifiers: string[]): void {
		this.failedGlobalTriggers = new Set(identifiers)
	}
}
