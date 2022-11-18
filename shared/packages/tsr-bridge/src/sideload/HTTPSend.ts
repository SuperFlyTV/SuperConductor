import { DeviceOptionsHTTPSend } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, HTTPRequest } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'

export class HTTPSendSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsHTTPSend, _log: LoggerLike) {}
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

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

		return Object.values(resources)
	}
}
