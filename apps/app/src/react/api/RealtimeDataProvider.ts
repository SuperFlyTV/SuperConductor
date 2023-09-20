import { SystemMessageOptions } from '../../ipc/IPCAPI'
import { BridgeStatus } from '../../models/project/Bridge'
import { Project } from '../../models/project/Project'
import { PeripheralStatus } from '../../models/project/Peripheral'
import { MetadataAny, ResourceAny, ResourceId, SerializedProtectedMap, TSRDeviceId } from '@shared/models'
import { Rundown } from '../../models/rundown/Rundown'
import { AppData } from '../../models/App/AppData'
import { ActiveTriggers } from '../../models/rundown/Trigger'
import { DefiningArea } from '../../lib/triggers/keyDisplay/keyDisplay'
import { ClientSideLogger } from './logger'
import { ActiveAnalog } from '../../models/rundown/Analog'
import { AnalogInput } from '../../models/project/AnalogInput'
import { BridgeId } from '@shared/api'
import { BridgePeripheralId } from '@shared/lib'
import { app } from './ApiClient'

/** This class is used client-side, to handle messages from the server */
export class RealtimeDataProvider {
	constructor(
		private logger: ClientSideLogger,
		private callbacks: {
			systemMessage?: (message: string, options: SystemMessageOptions) => void

			updateAppData?: (appData: AppData) => void
			updateProject?: (project: Project) => void
			updateRundown?: (fileName: string, rundown: Rundown) => void
			updateResourcesAndMetadata?: (
				resources: Array<{ id: ResourceId; resource: ResourceAny | null }>,
				metadata: SerializedProtectedMap<TSRDeviceId, MetadataAny | null>
			) => void
			updateBridgeStatus?: (id: BridgeId, status: BridgeStatus | null) => void
			updatePeripheral?: (peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null) => void
			updatePeripheralTriggers?: (peripheralTriggers: ActiveTriggers) => void
			updatePeripheralAnalog?: (fullIdentifier: string, analog: ActiveAnalog | null) => void
			updateDeviceRefreshStatus?: (deviceId: TSRDeviceId, refreshing: boolean) => void
			displayAboutDialog?: () => void
			updateDefiningArea?: (definingArea: DefiningArea | null) => void
			updateFailedGlobalTriggers?: (identifiers: string[]) => void
			updateAnalogInput?: (fullIdentifier: string, analogInput: AnalogInput | null) => void
		}
	) {
		// this is new:
		app.service('rundowns').on('updated', (rundown) => this.updateRundown(rundown.id, rundown))
		// app.service('project').on(...) etc.

		// this is temporary:
		app.service('legacy').on('callMethod', (args) => this.handleCallMethod(args[0], args.slice(1)))
	}

	// --- legacy, remove

	private handleCallMethod(methodname: string, args: any[]): void {
		const fcn = (this as any)[methodname]
		if (!fcn) {
			this.logger.error(`IPCClient: method ${methodname} not found`)
		} else {
			fcn.apply(this, args)
		}
	}

	systemMessage(message: string, options: SystemMessageOptions): void {
		this.callbacks.systemMessage?.(message, options)
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
	updateResourcesAndMetadata(
		resources: Array<{ id: ResourceId; resource: ResourceAny | null }>,
		metadata: SerializedProtectedMap<TSRDeviceId, MetadataAny | null>
	): void {
		this.callbacks.updateResourcesAndMetadata?.(resources, metadata)
	}
	updateBridgeStatus(id: BridgeId, bridgeStatus: BridgeStatus | null): void {
		this.callbacks.updateBridgeStatus?.(id, bridgeStatus)
	}
	updatePeripheral(peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null): void {
		this.callbacks.updatePeripheral?.(peripheralId, peripheral)
	}
	updatePeripheralTriggers(peripheralTriggers: ActiveTriggers): void {
		this.callbacks.updatePeripheralTriggers?.(peripheralTriggers)
	}
	updatePeripheralAnalog(fullIdentifier: string, analog: ActiveAnalog | null): void {
		this.callbacks.updatePeripheralAnalog?.(fullIdentifier, analog)
	}
	updateDeviceRefreshStatus(deviceId: TSRDeviceId, refreshing: boolean): void {
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
		// eslint-disable-next-line @typescript-eslint/unbound-method
		// this.ipcRenderer.off('callMethod', this.handleCallMethod)
	}

	// --- legacy end
}
