import { DeviceOptionsTCPSend } from 'timeline-state-resolver'
import {
	protectString,
	ResourceAny,
	ResourceId,
	ResourceType,
	TCPRequest,
	TCPSendMetadata,
	MetadataAny,
	MetadataType,
	TSRDeviceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload.js'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource } from '@shared/lib'

export class TCPSendSideload implements SideLoadDevice {
	constructor(
		private deviceId: TSRDeviceId,
		_deviceOptions: DeviceOptionsTCPSend,
		_log: LoggerLike
	) {}
	async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: TCPSendMetadata = { metadataType: MetadataType.TCP_SEND }

		// TCP Request
		{
			const resource: TCPRequest = {
				resourceType: ResourceType.TCP_REQUEST,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'TCP Request',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		return {
			resources: Array.from(resources.values()),
			metadata,
		}
	}
}
