import { makeAutoObservable } from 'mobx'
import { ApiClient } from '../api/ApiClient'
import { RealtimeDataProvider } from '../api/RealtimeDataProvider'
import { ClientSideLogger } from '../api/logger'

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
