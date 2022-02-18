import { BrowserWindow } from 'electron'
import { LogEntry } from 'winston'
import { IPCClientMethods } from '../ipc/IPCAPI'

/** This class is used server-side, to send messages to the client */
export class IPCClient implements IPCClientMethods {
	constructor(private mainWindow: BrowserWindow) {}

	log(entry: LogEntry): void {
		this.mainWindow?.webContents.send('callMethod', 'log', entry)
	}
}
