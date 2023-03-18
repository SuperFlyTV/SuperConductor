import { DeviceOptionsHTTPSend } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, HTTPRequest, ResourceId } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { generateResourceId } from '@shared/lib'

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
				id: generateResourceId(this.deviceId, ResourceType.HTTP_REQUEST, 0),
				displayName: 'HTTP Request',
			}
			resources.set(resource.id, resource)
		}

		return Array.from(resources.values())
	}
}
