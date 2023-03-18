import { DeviceOptionsOSC } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, OSCMessage, ResourceId } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { generateResourceId } from '@shared/lib'

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
				id: generateResourceId(this.deviceId, ResourceType.OSC_MESSAGE, 0),
				displayName: 'OSC Message',
			}
			resources.set(resource.id, resource)
		}

		return Array.from(resources.values())
	}
}
