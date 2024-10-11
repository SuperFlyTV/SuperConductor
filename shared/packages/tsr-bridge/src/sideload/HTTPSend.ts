import { DeviceOptionsHTTPSend } from 'timeline-state-resolver'
import {
	ResourceAny,
	ResourceType,
	HTTPRequest,
	ResourceId,
	protectString,
	MetadataAny,
	HTTPSendMetadata,
	MetadataType,
	TSRDeviceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload.js'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource } from '@shared/lib'

export class HTTPSendSideload implements SideLoadDevice {
	constructor(
		private deviceId: TSRDeviceId,
		_deviceOptions: DeviceOptionsHTTPSend,
		_log: LoggerLike
	) {}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: HTTPSendMetadata = { metadataType: MetadataType.HTTP_SEND }

		// HTTP Request
		{
			const resource: HTTPRequest = {
				resourceType: ResourceType.HTTP_REQUEST,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'HTTP Request',
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
