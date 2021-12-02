import { ResourceBase, ResourceType } from './resource'

export type CasparCGAny = CasparCGServer | CasparCGMedia | CasparCGTemplate

export interface CasparCGServer extends ResourceBase {
	resourceType: ResourceType.CASPARCG_SERVER

	/** The number of channels the server has */
	channels: number
}
export interface CasparCGMedia extends ResourceBase {
	resourceType: ResourceType.CASPARCG_MEDIA

	type: 'image' | 'video'
	name: string
	size: number
	changed: number
	frames: number
	frameTime: string
	frameRate: number
	duration: number
	thumbnail?: string
}

export interface CasparCGTemplate extends ResourceBase {
	resourceType: ResourceType.CASPARCG_TEMPLATE

	name: string
}
