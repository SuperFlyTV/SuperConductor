import { AppModel } from '@/models/AppModel'
import { BrowserWindow } from 'electron'
import { IPCClientMethods } from '../ipc/IPCAPI'

/** This class is used server-side, to send messages to the client */
export class IPCClient implements IPCClientMethods {
	constructor(private mainWindow: BrowserWindow) {}

	appFeed(data: AppModel): void {
		this.mainWindow?.webContents.send('callMethod', 'appFeed', data)
	}
}
