import { makeAutoObservable, runInAction } from 'mobx'
import { AnalogInput } from '../../models/project/AnalogInput'
import { ActiveAnalog } from '../../models/rundown/Analog'
import { IPCClient } from '../api/IPCClient'
import { IPCServer } from '../api/IPCServer'
import { ClientSideLogger } from '../api/logger'
const { ipcRenderer } = window.require('electron')

export class AnalogStore {
	private analogInputs = new Map<string, AnalogInput>()

	private activeAnalogListeners: ((activeAnalog: ActiveAnalog) => void)[] // Not an observable
	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	constructor() {
		makeAutoObservable(this)

		this.activeAnalogListeners = []

		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateAnalogInput: (fullIdentifier: string, analogInput: AnalogInput | null) =>
				this.updateAnalogInput(fullIdentifier, analogInput),
		})
	}

	updateAnalogInput(fullIdentifier: string, analogInput: AnalogInput | null): void {
		runInAction(() => {
			if (analogInput) {
				this.analogInputs.set(fullIdentifier, analogInput)
			} else {
				this.analogInputs.delete(fullIdentifier)
			}
		})
	}
	getAnalogInput(fullIdentifier: string): AnalogInput | undefined {
		return this.analogInputs.get(fullIdentifier)
	}

	updateActiveAnalog(activeAnalog: ActiveAnalog): void {
		for (const listener of this.activeAnalogListeners) {
			listener(activeAnalog)
		}
	}
	listenToActiveAnalog(listener: (activeAnalog: ActiveAnalog) => void): { stop: () => void } {
		this.activeAnalogListeners.push(listener)
		return {
			stop: () => {
				const index = this.activeAnalogListeners.indexOf(listener)
				if (index !== -1) this.activeAnalogListeners.splice(index, 1)
			},
		}
	}
}
