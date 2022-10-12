import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
import { IPCClient } from '../api/IPCClient'
import { ClientSideLogger } from '../api/logger'
const { ipcRenderer } = window.require('electron')

export class TriggersStore {
	failedGlobalTriggers: Set<string> = new Set()

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	constructor() {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateFailedGlobalTriggers: (identifiers: string[]) => this.updateFailedGlobalTriggers(identifiers),
		})

		makeAutoObservable(this)
	}

	updateFailedGlobalTriggers(identifiers: string[]) {
		this.failedGlobalTriggers = new Set(identifiers)
	}
}
