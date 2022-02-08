import { IPCClientMethods } from '../../ipc/IPCAPI'
import { BridgeStatus } from '../../models/project/Bridge'
import { Project } from '../../models/project/Project'
import { Peripheral } from '../../models/project/Peripheral'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../../models/rundown/Rundown'
import { AppData } from '../../models/App/AppData'

/** This class is used client-side, to handle messages from the server */
export class IPCClient implements IPCClientMethods {
	constructor(
		private ipcRenderer: Electron.IpcRenderer,
		private callbacks: {
			updateAppData: (appData: AppData) => void
			updateProject: (project: Project) => void
			updateRundown: (fileName: string, rundown: Rundown) => void
			updateResource: (id: string, resource: ResourceAny | null) => void
			updateBridgeStatus: (id: string, status: BridgeStatus | null) => void
			updatePeripheral: (peripheralId: string, peripheral: Peripheral | null) => void
			updatePeripheralTriggers: (peripheralTriggers: { [fullIdentifier: string]: true }) => void
			openSettings: () => void
		}
	) {
		this.handleCallMethod = this.handleCallMethod.bind(this)
		this.ipcRenderer.on('callMethod', this.handleCallMethod)
	}

	private handleCallMethod(_event: Electron.IpcRendererEvent, methodname: string, ...args: any[]): void {
		const fcn = (this as any)[methodname]
		if (!fcn) {
			console.error(`IPCClient: method ${methodname} not found`)
		} else {
			fcn.apply(this, args)
		}
	}

	updateAppData(appData: AppData): void {
		this.callbacks.updateAppData(appData)
	}
	updateProject(project: Project): void {
		this.callbacks.updateProject(project)
	}
	updateRundown(fileName: string, rundown: Rundown): void {
		this.callbacks.updateRundown(fileName, rundown)
	}
	updateResource(id: string, resource: ResourceAny | null): void {
		this.callbacks.updateResource(id, resource)
	}
	updateBridgeStatus(id: string, bridgeStatus: BridgeStatus | null): void {
		this.callbacks.updateBridgeStatus(id, bridgeStatus)
	}
	updatePeripheral(peripheralId: string, peripheral: Peripheral | null): void {
		this.callbacks.updatePeripheral(peripheralId, peripheral)
	}
	updatePeripheralTriggers(peripheralTriggers: { [fullIdentifier: string]: true }): void {
		this.callbacks.updatePeripheralTriggers(peripheralTriggers)
	}
	openSettings(): void {
		this.callbacks.openSettings()
	}
	destroy(): void {
		this.ipcRenderer.off('callMethod', this.handleCallMethod)
	}
}
