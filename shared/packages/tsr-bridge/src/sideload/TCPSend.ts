import { DeviceOptionsTCPSend } from 'timeline-state-resolver'
import { protectString, ResourceAny, ResourceId, ResourceType, TCPRequest } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource } from '@shared/lib'

export class TCPSendSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsTCPSend, _log: LoggerLike) {}
	async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

		// HTTP Request
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

		return Array.from(resources.values())
	}
}
