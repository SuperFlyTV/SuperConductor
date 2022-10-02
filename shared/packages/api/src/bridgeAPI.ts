import { ResourceAny } from '@shared/models'
import { AvailablePeripheral, PeripheralSettingsAny } from './peripherals'
import { DeviceOptionsAny, Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { KeyDisplay, KeyDisplayTimeline, PeripheralInfo } from './peripherals'

export namespace BridgeAPI {
	export namespace FromBridge {
		export type Any =
			| InitRequestId
			| Init
			| Status
			| DeviceStatus
			| DeviceRemoved
			| UpdatedResources
			| TimelineIds
			| PeripheralStatus
			| PeripheralTrigger
			| DeviceRefreshStatus
			| AvailablePeripherals

		/** Bridge starts by sending this upon connection (if it is a server). SuperConductor replies with SetId */
		export interface InitRequestId extends MessageBase {
			type: 'initRequestId'
		}

		/** Bridge starts by sending this upon connection (and it has its id): */
		export interface Init extends MessageBase {
			type: 'init'
			id: string
			version: string
			/** Set to true if the bridge is the one connecting to SuperConector (incoming bridge)  */
			incoming: boolean
		}
		export interface Status extends MessageBase {
			type: 'status'
			// todo
		}
		export interface DeviceStatus extends MessageBase {
			type: 'deviceStatus'
			deviceId: string

			ok: boolean
			message: string
		}
		export interface DeviceRemoved extends MessageBase {
			type: 'deviceRemoved'
			deviceId: string
		}
		export interface UpdatedResources extends MessageBase {
			type: 'updatedResources'
			deviceId: string
			resources: ResourceAny[]
		}
		export interface TimelineIds extends MessageBase {
			type: 'timelineIds'
			timelineIds: string[]
			// A reply to GetTimelineIds
		}
		export interface PeripheralStatus extends MessageBase {
			type: 'PeripheralStatus'
			deviceId: string
			info: PeripheralInfo
			status: 'connected' | 'disconnected'
		}
		export interface PeripheralTrigger extends MessageBase {
			type: 'PeripheralTrigger'
			deviceId: string
			trigger: 'keyDown' | 'keyUp'
			identifier: string
		}

		/**
		 * Used to tell SuperConductor when a device is refreshing its resources.
		 * Will be sent in response to refreshResources messages,
		 * but can also be sent independently. For example, this message
		 * will be sent when a device changes status, because TSR-Bridge
		 * automatically refreshes devices when their statuses change.
		 */
		export interface DeviceRefreshStatus extends MessageBase {
			type: 'DeviceRefreshStatus'
			deviceId: string
			refreshing: boolean
		}
		export interface AvailablePeripherals extends MessageBase {
			type: 'AvailablePeripherals'
			peripherals: {
				[peripheralId: string]: AvailablePeripheral
			}
			// A reply to GetAvailablePeripherals
		}
	}

	export namespace FromSuperConductor {
		export type Any =
			| SetId
			| SetSettings
			| AddTimeline
			| RemoveTimeline
			| GetTimelineIds
			| SetMappings
			| RefreshResources
			| PeripheralSetKeyDisplay
			| GetAvailablePeripherals
		/** This is a reply to InitRequestId */
		export interface SetId extends MessageBase {
			type: 'setId'
			id: string
		}
		export interface SetSettings extends MessageBase {
			type: 'setSettings'

			devices: {
				[deviceId: string]: DeviceOptionsAny
			}
			peripherals: {
				[deviceId: string]: PeripheralSettingsAny
			}
			autoConnectToAllPeripherals: boolean
		}
		export interface AddTimeline extends MessageBase {
			type: 'addTimeline'

			timelineId: string
			timeline: TSRTimeline
			currentTime: number
		}
		export interface RemoveTimeline extends MessageBase {
			type: 'removeTimeline'

			timelineId: string
			currentTime: number
		}
		export interface GetTimelineIds extends MessageBase {
			type: 'getTimelineIds'
			// Bridge will reply with "timelineIds"
		}
		export interface SetMappings extends MessageBase {
			type: 'setMappings'

			mappings: Mappings
			currentTime: number
		}
		export interface RefreshResources extends MessageBase {
			type: 'refreshResources'
		}
		export interface PeripheralSetKeyDisplay extends MessageBase {
			type: 'peripheralSetKeyDisplay'
			deviceId: string
			identifier: string
			keyDisplay: KeyDisplay | KeyDisplayTimeline
		}
		export interface GetAvailablePeripherals extends MessageBase {
			type: 'getAvailablePeripherals'
			// Bridge will reply with "AvailablePeripherals"
		}
	}

	interface MessageBase {
		type: string
	}
}
