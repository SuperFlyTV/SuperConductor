import { DeviceOptionsHTTPSend } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, HTTPRequest, ResourceId, protectString } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource } from '@shared/lib'

export class HTTPSendSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsHTTPSend, _log: LoggerLike) {}
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

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

		return Array.from(resources.values())
	}
}
