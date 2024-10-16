import { BrowserWindow } from 'electron'
import { LogEntry } from 'winston'
import { IPCClientMethods } from '../ipc/IPCAPI.js'
import { AppSettings, AppSystem } from '../models/AppData.js'

/** This class is used server-side, to send messages to the client */
export class IPCClient implements IPCClientMethods {
	constructor(private mainWindow: BrowserWindow) {}

	log(entry: LogEntry): void {
		this.mainWindow?.webContents.send('callMethod', 'log', entry)
	}
	settings(settings: AppSettings): void {
		this.mainWindow?.webContents.send('callMethod', 'settings', settings)
	}
	system(system: AppSystem): void {
		this.mainWindow?.webContents.send('callMethod', 'system', system)
	}
}
