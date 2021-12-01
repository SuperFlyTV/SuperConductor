import { Project } from '@/models/project/Project'
import { ResourceAny } from '@/models/resource/resource'
import { Rundown } from '@/models/rundown/Rundown'
import { Resources } from '@/react/contexts/Resources'
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
}
