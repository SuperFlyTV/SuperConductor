// Note: This file is a copy of the one in the electron folder.
// This is a temporary solution, should be DRY:ed when we have a mono repo.

import { DeviceOptionsAny, Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { ResourceAny } from './resource/resource'

export namespace BridgeAPI {
	export namespace FromBridge {
		export type Any = InitRequestId | Init | Status | DeviceStatus | UpdatedResources | TimelineIds

		/** Bridge starts by sending this upon connection (if it is a server). TPT replies with SetId */
		export interface InitRequestId extends MessageBase {
			type: 'initRequestId'
		}

		/** Bridge starts by sending this upon connection (and it has its id): */
		export interface Init extends MessageBase {
			type: 'init'
			id: string
			version: number
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
	}

	export namespace FromTPT {
		export type Any =
			| SetId
			| SetSettings
			| AddTimeline
			| RemoveTimeline
			| GetTimelineIds
			| SetMappings
			| RefreshResources
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
		}
		export interface AddTimeline extends MessageBase {
			type: 'addTimeline'

			timelineId: string
			timeline: TSRTimeline
		}
		export interface RemoveTimeline extends MessageBase {
			type: 'removeTimeline'

			timelineId: string
		}
		export interface GetTimelineIds extends MessageBase {
			type: 'getTimelineIds'
			// Bridge will reply with "timelineIds"
		}
		export interface SetMappings extends MessageBase {
			type: 'setMappings'

			mappings: Mappings
		}
		export interface RefreshResources extends MessageBase {
			type: 'refreshResources'
		}
	}

	interface MessageBase {
		type: string
	}
}
