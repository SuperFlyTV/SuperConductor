import { IPCClientMethods } from '../../ipc/IPCAPI'
import { BridgeStatus } from '../../models/project/Bridge'
import { Project } from '../../models/project/Project'
import { Peripheral } from '../../models/project/Peripheral'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../../models/rundown/Rundown'
import { AppData } from '../../models/App/AppData'
import { ActiveTriggers } from '../../models/rundown/Trigger'

/** This class is used client-side, to handle messages from the server */
export class IPCClient implements IPCClientMethods {
	constructor(
		private ipcRenderer: Electron.IpcRenderer,
		private callbacks: {
			updateAppData?: (appData: AppData) => void
			updateProject?: (project: Project) => void
			updateRundown?: (fileName: string, rundown: Rundown) => void
			updateResource?: (id: string, resource: ResourceAny | null) => void
			updateBridgeStatus?: (id: string, status: BridgeStatus | null) => void
			updatePeripheral?: (peripheralId: string, peripheral: Peripheral | null) => void
			updatePeripheralTriggers?: (peripheralTriggers: ActiveTriggers) => void
			openSettings?: () => void
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
		if (this.callbacks.updateAppData) this.callbacks.updateAppData(appData)
	}
	updateProject(project: Project): void {
		if (this.callbacks.updateProject) this.callbacks.updateProject(project)
	}
	updateRundown(fileName: string, rundown: Rundown): void {
		if (this.callbacks.updateRundown) this.callbacks.updateRundown(fileName, rundown)
	}
	updateResource(id: string, resource: ResourceAny | null): void {
		if (this.callbacks.updateResource) this.callbacks.updateResource(id, resource)
	}
	updateBridgeStatus(id: string, bridgeStatus: BridgeStatus | null): void {
		if (this.callbacks.updateBridgeStatus) this.callbacks.updateBridgeStatus(id, bridgeStatus)
	}
	updatePeripheral(peripheralId: string, peripheral: Peripheral | null): void {
		if (this.callbacks.updatePeripheral) this.callbacks.updatePeripheral(peripheralId, peripheral)
	}
	updatePeripheralTriggers(peripheralTriggers: ActiveTriggers): void {
		if (this.callbacks.updatePeripheralTriggers) this.callbacks.updatePeripheralTriggers(peripheralTriggers)
	}
	openSettings(): void {
		if (this.callbacks.openSettings) this.callbacks.openSettings()
	}
	destroy(): void {
		this.ipcRenderer.off('callMethod', this.handleCallMethod)
	}
}
