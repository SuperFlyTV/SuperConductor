import { DeviceOptionsOSC } from 'timeline-state-resolver'
import {
	ResourceAny,
	ResourceType,
	OSCMessage,
	ResourceId,
	protectString,
	OSCMetadata,
	MetadataAny,
	MetadataType,
	TSRDeviceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload.js'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource } from '@shared/lib'

export class OSCSideload implements SideLoadDevice {
	constructor(private deviceId: TSRDeviceId, _deviceOptions: DeviceOptionsOSC, _log: LoggerLike) {}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: OSCMetadata = { metadataType: MetadataType.OSC }

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

		return {
			resources: Array.from(resources.values()),
			metadata,
		}
	}
}
