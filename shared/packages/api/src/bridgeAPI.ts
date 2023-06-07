import { MetadataAny, ResourceAny, TSRDeviceId, SerializedProtectedMap } from '@shared/models'
import { AnalogValue, KnownPeripheral, PeripheralId, PeripheralSettingsAny } from './peripherals'
import { DeviceOptionsAny, Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { KeyDisplay, KeyDisplayTimeline, PeripheralInfo } from './peripherals'
import { BridgeId } from './bridge'

export namespace BridgeAPI {
	export namespace FromBridge {
		export type Any =
			| InitRequestId
			| Init
			| Status
			| DeviceStatus
			| DeviceRemoved
			| UpdatedResourcesAndMetadata
			| TimelineIds
			| PeripheralStatus
			| PeripheralTrigger
			| PeripheralAnalog
			| DeviceRefreshStatus
			| KnownPeripherals

		/** Bridge starts by sending this upon connection (if it is a server). SuperConductor replies with SetId */
		export interface InitRequestId extends MessageBase {
			type: 'initRequestId'
		}

		/** Bridge starts by sending this upon connection (and it has its id): */
		export interface Init extends MessageBase {
			type: 'init'
			id: BridgeId
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
			deviceId: TSRDeviceId

			ok: boolean
			message: string
		}
		export interface DeviceRemoved extends MessageBase {
			type: 'deviceRemoved'
			deviceId: TSRDeviceId
		}
		export interface UpdatedResourcesAndMetadata extends MessageBase {
			type: 'updatedResourcesAndMetadata'
			deviceId: TSRDeviceId
			resources: ResourceAny[]
			metadata: MetadataAny
		}
		export interface TimelineIds extends MessageBase {
			type: 'timelineIds'
			timelineIds: string[]
			// A reply to GetTimelineIds
		}
		export interface PeripheralStatus extends MessageBase {
			type: 'PeripheralStatus'
			deviceId: PeripheralId
			info: PeripheralInfo
			status: 'connected' | 'disconnected'
		}
		export interface PeripheralTrigger extends MessageBase {
			type: 'PeripheralTrigger'
			deviceId: PeripheralId
			trigger: 'keyDown' | 'keyUp'
			identifier: string
		}
		export interface PeripheralAnalog extends MessageBase {
			type: 'PeripheralAnalog'
			deviceId: PeripheralId
			identifier: string
			value: AnalogValue
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
			deviceId: TSRDeviceId
			refreshing: boolean
		}
		export interface KnownPeripherals extends MessageBase {
			type: 'KnownPeripherals'
			peripherals: SerializedProtectedMap<PeripheralId, KnownPeripheral>
			// A reply to GetKnownPeripherals
		}
	}

	export namespace FromSuperConductor {
		export type Any =
			| SetId
			| SetSettings
			| AddTimeline
			| RemoveTimeline
			| UpdateDatastore
			| GetTimelineIds
			| SetMappings
			| RefreshResources
			| PeripheralSetKeyDisplay
			| GetKnownPeripherals
		/** This is a reply to InitRequestId */
		export interface SetId extends MessageBase {
			type: 'setId'
			id: BridgeId
		}
		export interface SetSettings extends MessageBase {
			type: 'setSettings'

			devices: SerializedProtectedMap<TSRDeviceId, DeviceOptionsAny>
			peripherals: SerializedProtectedMap<PeripheralId, PeripheralSettingsAny>
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
		export interface UpdateDatastore extends MessageBase {
			type: 'updateDatastore'

			updates: {
				datastoreKey: string
				value: any | null
				modified: number
			}[]
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
			deviceId: PeripheralId
			identifier: string
			keyDisplay: KeyDisplay | KeyDisplayTimeline
		}
		export interface GetKnownPeripherals extends MessageBase {
			type: 'getKnownPeripherals'
			// Bridge will reply with "KnownPeripherals"
		}
	}

	interface MessageBase {
		type: string
	}
}
