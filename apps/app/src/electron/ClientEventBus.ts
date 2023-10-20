import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { MetadataAny, ResourceAny, ResourceId, SerializedProtectedMap, TSRDeviceId } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { PeripheralStatus } from '../models/project/Peripheral'
import { IPCClientMethods, SystemMessageOptions } from '../ipc/IPCAPI'
import { AppData } from '../models/App/AppData'
import { ActiveTriggers } from '../models/rundown/Trigger'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { ActiveAnalog } from '../models/rundown/Analog'
import { AnalogInput } from '../models/project/AnalogInput'
import { BridgeId } from '@shared/api'
import { BridgePeripheralId } from '@shared/lib'
import { EventEmitter } from 'stream'

// --- some of it might be needed, most of it hopefully not
export class ClientEventBus extends EventEmitter implements IPCClientMethods {
	close(): void {
		// Nothing here
	}

	systemMessage(message: string, options: SystemMessageOptions): void {
		this.emit('callMethod', 'systemMessage', message, options)
	}
	updateAppData(appData: AppData): void {
		this.emit('callMethod', 'updateAppData', appData)
	}
	updateProject(project: Project): void {
		this.emit('updateProject', project) // TODO: some type safety, please
	}
	updateRundown(_fileName: string, rundown: Rundown): void {
		this.emit('updateRundown', rundown) // TODO: some type safety, please
	}
	updateResourcesAndMetadata(
		resources: Array<{ id: ResourceId; resource: ResourceAny | null }>,
		metadata: SerializedProtectedMap<TSRDeviceId, MetadataAny | null>
	): void {
		this.emit('callMethod', 'updateResourcesAndMetadata', resources, metadata)
	}
	updateBridgeStatus(id: BridgeId, status: BridgeStatus | null): void {
		this.emit('callMethod', 'updateBridgeStatus', id, status)
	}
	updatePeripheral(peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null): void {
		this.emit('callMethod', 'updatePeripheral', peripheralId, peripheral)
	}
	updatePeripheralTriggers(peripheralTriggers: ActiveTriggers): void {
		this.emit('callMethod', 'updatePeripheralTriggers', peripheralTriggers)
	}
	updatePeripheralAnalog(fullIdentifier: string, analog: ActiveAnalog | null): void {
		this.emit('callMethod', 'updatePeripheralAnalog', fullIdentifier, analog)
	}
	updateDeviceRefreshStatus(deviceId: TSRDeviceId, refreshing: boolean): void {
		this.emit('callMethod', 'updateDeviceRefreshStatus', deviceId, refreshing)
	}
	displayAboutDialog(): void {
		this.emit('callMethod', 'displayAboutDialog')
	}
	updateDefiningArea(definingArea: DefiningArea | null): void {
		this.emit('callMethod', 'updateDefiningArea', definingArea)
	}
	updateFailedGlobalTriggers(identifiers: string[]): void {
		this.emit('callMethod', 'updateFailedGlobalTriggers', identifiers)
	}
	updateAnalogInput(fullIdentifier: string, analogInput: AnalogInput | null): void {
		this.emit('callMethod', 'updateAnalogInput', fullIdentifier, analogInput)
	}
}
