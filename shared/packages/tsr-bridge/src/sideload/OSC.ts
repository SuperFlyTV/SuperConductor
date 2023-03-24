import { DeviceOptionsOSC } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, OSCMessage, ResourceId, protectString } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource } from '@shared/lib'

export class OSCSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsOSC, _log: LoggerLike) {}
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

		// Message
		{
			const resource: OSCMessage = {
				resourceType: ResourceType.OSC_MESSAGE,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'OSC Message',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		return Array.from(resources.values())
	}
}
