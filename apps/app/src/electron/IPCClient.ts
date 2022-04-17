import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { PeripheralStatus } from '../models/project/Peripheral'
import { BrowserWindow } from 'electron'
import { IPCClientMethods } from '../ipc/IPCAPI'
import { AppData } from '../models/App/AppData'
import { ActiveTriggers } from '../models/rundown/Trigger'
import { DefiningArea } from 'src/lib/triggers/keyDisplay'

/** This class is used server-side, to send messages to the client */
export class IPCClient implements IPCClientMethods {
	constructor(private mainWindow: BrowserWindow) {}

	updateAppData(appData: AppData): void {
		this.mainWindow?.webContents.send('callMethod', 'updateAppData', appData)
	}
	updateProject(project: Project): void {
		this.mainWindow?.webContents.send('callMethod', 'updateProject', project)
	}
	updateRundown(fileName: string, rundown: Rundown): void {
		this.mainWindow?.webContents.send('callMethod', 'updateRundown', fileName, rundown)
	}
	updateResources(resources: Array<{ id: string; resource: ResourceAny | null }>): void {
		this.mainWindow?.webContents.send('callMethod', 'updateResources', resources)
	}
	updateBridgeStatus(id: string, status: BridgeStatus | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updateBridgeStatus', id, status)
	}
	updatePeripheral(peripheralId: string, peripheral: PeripheralStatus | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updatePeripheral', peripheralId, peripheral)
	}
	updatePeripheralTriggers(peripheralTriggers: ActiveTriggers): void {
		this.mainWindow?.webContents.send('callMethod', 'updatePeripheralTriggers', peripheralTriggers)
	}
	updateDeviceRefreshStatus(deviceId: string, refreshing: boolean): void {
		this.mainWindow?.webContents.send('callMethod', 'updateDeviceRefreshStatus', deviceId, refreshing)
	}
	displayAboutDialog(): void {
		this.mainWindow?.webContents.send('callMethod', 'displayAboutDialog')
	}
	updateDefiningArea(definingArea: DefiningArea | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updateDefiningArea', definingArea)
	}
}
