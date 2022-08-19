import { ResourceBase, ResourceType } from './resource'

export type HyperdeckAny = HyperdeckPlay | HyperdeckRecord | HyperdeckPreview

export interface HyperdeckPlay extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_PLAY
}

export interface HyperdeckRecord extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_RECORD
}

export interface HyperdeckPreview extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_PREVIEW
}
