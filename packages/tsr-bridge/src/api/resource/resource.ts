import { CasparCGAny } from './CasparCG'

export type ResourceAny = CasparCGAny

export interface ResourceBase {
	resourceType: ResourceType

	deviceId: string
	id: string // unique within that deviceId
}
export enum ResourceType {
	CASPARCG_SERVER = 'CASPARCG_SERVER',

	CASPARCG_MEDIA = 'CASPARCG_MEDIA',
	CASPARCG_TEMPLATE = 'CASPARCG_TEMPLATE',
}
