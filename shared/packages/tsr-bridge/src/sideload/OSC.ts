import { DeviceOptionsOSC } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, OSCMessage, OSCMetadata, MetadataAny, MetadataType } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'

export class OSCSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsOSC, _log: LoggerLike) {}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResourcesAndMetadata() {
		const resources: { [id: string]: ResourceAny } = {}
		const metadata: OSCMetadata = { metadataType: MetadataType.OSC }

		// Message
		{
			const resource: OSCMessage = {
				resourceType: ResourceType.OSC_MESSAGE,
				deviceId: this.deviceId,
				id: `${this.deviceId}_osc_message`,
				displayName: 'OSC Message',
			}
			resources[resource.id] = resource
		}

		return {
			resources: Object.values(resources),
			metadata,
		}
	}
}
