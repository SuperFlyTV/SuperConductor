import { BridgeStatus } from '../models/project/Bridge.js'
import { Project } from '../models/project/Project.js'
import { MetadataAny, ResourceAny, ResourceId, SerializedProtectedMap, TSRDeviceId } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown.js'
import { PeripheralStatus } from '../models/project/Peripheral.js'
import { IPCClientMethods, SystemMessageOptions } from '../ipc/IPCAPI.js'
import { AppData } from '../models/App/AppData.js'
import { ActiveTriggers } from '../models/rundown/Trigger.js'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay.js'
import { ActiveAnalog } from '../models/rundown/Analog.js'
import { AnalogInput } from '../models/project/AnalogInput.js'
import { BridgeId } from '@shared/api'
import { BridgePeripheralId } from '@shared/lib'
import EventEmitter from 'events'
import { SerializableLedgers } from '../models/project/Project.js'

type ClientEventBusEvents = {
	callMethod: [...args: any[]] // legacy
	updateUndoLedgers: [undoLedgers: SerializableLedgers]
	updateRundown: [rundown: Rundown]
	updateProject: [rundown: Project]
}

// --- some of it might be needed, most of it hopefully not
export class ClientEventBus extends EventEmitter<ClientEventBusEvents> implements IPCClientMethods {
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
		this.emit('updateProject', project)
	}
	updateRundown(_fileName: string, rundown: Rundown): void {
		this.emit('updateRundown', rundown)
	}
	updateUndoLedgers(data: SerializableLedgers): void {
		this.emit('updateUndoLedgers', data)
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
