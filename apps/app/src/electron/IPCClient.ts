import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { BrowserWindow } from 'electron'
import { IPCClientMethods } from '../ipc/IPCAPI'

/** This class is used server-side, to send messages to the client */
export class IPCClient implements IPCClientMethods {
	constructor(private mainWindow: BrowserWindow) {}

	updateProject(project: Project): void {
		this.mainWindow?.webContents.send('callMethod', 'updateProject', project)
	}
	updateRundown(fileName: string, rundown: Rundown): void {
		this.mainWindow?.webContents.send('callMethod', 'updateRundown', fileName, rundown)
	}
	updateResource(id: string, resource: ResourceAny | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updateResource', id, resource)
	}
	updateBridgeStatus(id: string, status: BridgeStatus | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updateBridgeStatus', id, status)
	}
	openSettings(): void {
		this.mainWindow?.webContents.send('callMethod', 'openSettings')
	}
}
