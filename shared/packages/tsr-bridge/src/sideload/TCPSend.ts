import { DeviceOptionsTCPSend } from 'timeline-state-resolver'
import { MetadataAny, ResourceAny, ResourceType, TCPRequest, TCPSendMetadata } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { MetadataType } from '@shared/models'

export class TCPSendSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsTCPSend, _log: LoggerLike) {}
	async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		// Nothing to cleanup.
	}
	private async _refreshResourcesAndMetadata() {
		const resources: { [id: string]: ResourceAny } = {}
		const metadata: TCPSendMetadata = { metadataType: MetadataType.TCP_SEND }

		// TCP Request
		{
			const resource: TCPRequest = {
				resourceType: ResourceType.TCP_REQUEST,
				deviceId: this.deviceId,
				id: `${this.deviceId}_tcp_request`,
				displayName: 'TCP Request',
			}
			resources[resource.id] = resource
		}

		return {
			resources: Object.values(resources),
			metadata,
		}
	}
}
