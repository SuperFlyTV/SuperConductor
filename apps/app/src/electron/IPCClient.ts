import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { PeripheralStatus } from '../models/project/Peripheral'
import { BrowserWindow } from 'electron'
import { IPCClientMethods, SystemMessageOptions } from '../ipc/IPCAPI'
import { AppData } from '../models/App/AppData'
import { ActiveTriggers } from '../models/rundown/Trigger'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { ActiveAnalog } from '../models/rundown/Analog'
import { AnalogInput } from '../models/project/AnalogInput'

/** This class is used server-side, to send messages to the client */
export class IPCClient implements IPCClientMethods {
	constructor(private mainWindow: BrowserWindow) {}

	close(): void {
		// Nothing here
	}

	systemMessage(message: string, options: SystemMessageOptions): void {
		this.mainWindow?.webContents.send('callMethod', 'systemMessage', message, options)
	}
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
	updatePeripheralAnalog(fullIdentifier: string, analog: ActiveAnalog | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updatePeripheralAnalog', fullIdentifier, analog)
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
	updateFailedGlobalTriggers(identifiers: string[]): void {
		this.mainWindow?.webContents.send('callMethod', 'updateFailedGlobalTriggers', identifiers)
	}
	updateAnalogInput(fullIdentifier: string, analogInput: AnalogInput | null): void {
		this.mainWindow?.webContents.send('callMethod', 'updateAnalogInput', fullIdentifier, analogInput)
	}
}
