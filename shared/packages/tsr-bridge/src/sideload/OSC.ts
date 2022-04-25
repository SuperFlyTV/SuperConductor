import { Logger } from 'winston'
import { DeviceOptionsOSC } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, OSCMessage } from '@shared/models'
import { SideLoadDevice } from './sideload'

export class OSCSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsOSC, _log: Logger) {}
	refreshResources() {
		return this._refreshResources()
	}
	async close() {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

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

		return Object.values(resources)
	}
}
