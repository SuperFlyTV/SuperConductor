import { IPCServerMethods } from '../ipc/IPCAPI.js'

import { LoggerLike } from '@shared/api'
import { AppSettings } from '../models/AppData.js'
import { StorageHandler } from './storageHandler.js'

/** This class is used server-side, to handle requests from the client */
export class IPCServer implements IPCServerMethods {
	constructor(
		ipcMain: Electron.IpcMain,
		private _log: LoggerLike,
		private storage: StorageHandler,
		private callbacks: {
			initialized: () => void
		}
	) {
		for (const methodName of Object.getOwnPropertyNames(IPCServer.prototype)) {
			if (methodName[0] !== '_') {
				const fcn = (this as any)[methodName].bind(this)
				if (fcn) {
					ipcMain.handle(methodName, async (event, ...args) => {
						try {
							return fcn(...args)
						} catch (error) {
							this._log.error(`Error when calling ${methodName}:`, error)
							throw error
						}
					})
				}
			}
		}
	}
	public updateSettings(newSettings: Partial<AppSettings>): void {
		const appData = this.storage.getAppData()

		this.storage.updateAppData({
			...appData,
			settings: {
				...appData.settings,
				...newSettings,
			},
		})
	}
	public initialized(): void {
		this.callbacks.initialized()
	}
}
