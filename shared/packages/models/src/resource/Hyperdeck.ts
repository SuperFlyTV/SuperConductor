import { ResourceBase, ResourceType } from './resource'

export type HyperdeckAny = HyperdeckPlay | HyperdeckRecord | HyperdeckPreview | HyperdeckClip

export interface HyperdeckPlay extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_PLAY
}

export interface HyperdeckRecord extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_RECORD
}

export interface HyperdeckPreview extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_PREVIEW
}

export interface HyperdeckClip extends ResourceBase {
	resourceType: ResourceType.HYPERDECK_CLIP
	slotId: number
	clipId: number
	clipName: string
}
