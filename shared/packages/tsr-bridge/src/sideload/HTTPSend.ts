import { DeviceOptionsHTTPSend } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, HTTPRequest, MetadataAny, HTTPSendMetadata, MetadataType } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'

export class HTTPSendSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsHTTPSend, _log: LoggerLike) {}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResourcesAndMetadata() {
		const resources: { [id: string]: ResourceAny } = {}
		const metadata: HTTPSendMetadata = { metadataType: MetadataType.HTTP_SEND }

		// HTTP Request
		{
			const resource: HTTPRequest = {
				resourceType: ResourceType.HTTP_REQUEST,
				deviceId: this.deviceId,
				id: `${this.deviceId}_http_request`,
				displayName: 'HTTP Request',
			}
			resources[resource.id] = resource
		}

		return {
			resources: Object.values(resources),
			metadata,
		}
	}
}
