import { DeviceOptionsTCPSend } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, TCPRequest } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'

export class TCPSendSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsTCPSend, _log: LoggerLike) {}
	refreshResources() {
		return this._refreshResources()
	}
	async close() {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

		// HTTP Request
		{
			const resource: TCPRequest = {
				resourceType: ResourceType.TCP_REQUEST,
				deviceId: this.deviceId,
				id: `${this.deviceId}_tcp_request`,
				displayName: 'TCP Request',
			}
			resources[resource.id] = resource
		}

		return Object.values(resources)
	}
}
