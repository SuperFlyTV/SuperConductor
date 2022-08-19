import { DeviceOptionsHyperdeck } from 'timeline-state-resolver'
import { ResourceAny, ResourceType, HyperdeckPlay, HyperdeckRecord, HyperdeckPreview } from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'

export class HyperdeckSideload implements SideLoadDevice {
	constructor(private deviceId: string, _deviceOptions: DeviceOptionsHyperdeck, _log: LoggerLike) {}
	refreshResources() {
		return this._refreshResources()
	}
	async close() {
		// Nothing to cleanup.
	}
	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

		// Play command
		{
			const resource: HyperdeckPlay = {
				resourceType: ResourceType.HYPERDECK_PLAY,
				deviceId: this.deviceId,
				id: `${this.deviceId}_hyperdeck_play`,
				displayName: 'Hyperdeck Play',
			}
			resources[resource.id] = resource
		}

		// Record command
		{
			const resource: HyperdeckRecord = {
				resourceType: ResourceType.HYPERDECK_RECORD,
				deviceId: this.deviceId,
				id: `${this.deviceId}_hyperdeck_record`,
				displayName: 'Hyperdeck Record',
			}
			resources[resource.id] = resource
		}

		// Preview command
		{
			const resource: HyperdeckPreview = {
				resourceType: ResourceType.HYPERDECK_PREVIEW,
				deviceId: this.deviceId,
				id: `${this.deviceId}_hyperdeck_preview`,
				displayName: 'Hyperdeck Preview',
			}
			resources[resource.id] = resource
		}

		return Object.values(resources)
	}
}
