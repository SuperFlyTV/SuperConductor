import { IPCClientMethods } from '../../ipc/IPCAPI'
import { BridgeStatus } from '../../models/project/Bridge'
import { Project } from '../../models/project/Project'
import { PeripheralStatus } from '../../models/project/Peripheral'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../../models/rundown/Rundown'
import { AppData } from '../../models/App/AppData'
import { ActiveTriggers } from '../../models/rundown/Trigger'
import { DefiningArea } from '../../lib/triggers/keyDisplay/keyDisplay'
import { ClientSideLogger } from './logger'
import { ActiveAnalog } from '../../models/rundown/Analog'
import { AnalogInput } from '../../models/project/AnalogInput'

/** This class is used client-side, to handle messages from the server */
export class IPCClient implements IPCClientMethods {
	constructor(
		private logger: ClientSideLogger,
		private ipcRenderer: Electron.IpcRenderer,
		private callbacks: {
			updateAppData?: (appData: AppData) => void
			updateProject?: (project: Project) => void
			updateRundown?: (fileName: string, rundown: Rundown) => void
			updateResources?: (resources: Array<{ id: string; resource: ResourceAny | null }>) => void
			updateBridgeStatus?: (id: string, status: BridgeStatus | null) => void
			updatePeripheral?: (peripheralId: string, peripheral: PeripheralStatus | null) => void
			updatePeripheralTriggers?: (peripheralTriggers: ActiveTriggers) => void
			updatePeripheralAnalog?: (fullIdentifier: string, analog: ActiveAnalog | null) => void
			updateDeviceRefreshStatus?: (deviceId: string, refreshing: boolean) => void
			displayAboutDialog?: () => void
			updateDefiningArea?: (definingArea: DefiningArea | null) => void
			updateFailedGlobalTriggers?: (identifiers: string[]) => void
			updateAnalogInput?: (fullIdentifier: string, analogInput: AnalogInput | null) => void
		}
	) {
		this.handleCallMethod = this.handleCallMethod.bind(this)
		this.ipcRenderer.on('callMethod', this.handleCallMethod)
	}

	private handleCallMethod(_event: Electron.IpcRendererEvent, methodname: string, ...args: any[]): void {
		const fcn = (this as any)[methodname]
		if (!fcn) {
			this.logger.error(`IPCClient: method ${methodname} not found`)
		} else {
			fcn.apply(this, args)
		}
	}

	updateAppData(appData: AppData): void {
		this.callbacks.updateAppData?.(appData)
	}
	updateProject(project: Project): void {
		this.callbacks.updateProject?.(project)
	}
	updateRundown(fileName: string, rundown: Rundown): void {
		this.callbacks.updateRundown?.(fileName, rundown)
	}
	updateResources(resources: Array<{ id: string; resource: ResourceAny | null }>): void {
		this.callbacks.updateResources?.(resources)
	}
	updateBridgeStatus(id: string, bridgeStatus: BridgeStatus | null): void {
		this.callbacks.updateBridgeStatus?.(id, bridgeStatus)
	}
	updatePeripheral(peripheralId: string, peripheral: PeripheralStatus | null): void {
		this.callbacks.updatePeripheral?.(peripheralId, peripheral)
	}
	updatePeripheralTriggers(peripheralTriggers: ActiveTriggers): void {
		this.callbacks.updatePeripheralTriggers?.(peripheralTriggers)
	}
	updatePeripheralAnalog(fullIdentifier: string, analog: ActiveAnalog | null): void {
		this.callbacks.updatePeripheralAnalog?.(fullIdentifier, analog)
	}
	updateDeviceRefreshStatus(deviceId: string, refreshing: boolean): void {
		this.callbacks.updateDeviceRefreshStatus?.(deviceId, refreshing)
	}
	displayAboutDialog(): void {
		this.callbacks.displayAboutDialog?.()
	}
	updateDefiningArea(definingArea: DefiningArea | null): void {
		this.callbacks.updateDefiningArea?.(definingArea)
	}
	updateFailedGlobalTriggers(identifiers: string[]): void {
		this.callbacks.updateFailedGlobalTriggers?.(identifiers)
	}
	updateAnalogInput(fullIdentifier: string, analogInput: AnalogInput | null): void {
		this.callbacks.updateAnalogInput?.(fullIdentifier, analogInput)
	}
	destroy(): void {
		this.ipcRenderer.off('callMethod', this.handleCallMethod)
	}
}
