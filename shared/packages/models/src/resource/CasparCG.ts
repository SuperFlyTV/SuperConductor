import { ResourceBase, ResourceType } from './resource.js'
import type { GDDSchema } from 'graphics-data-definition'

export type CasparCGAny = CasparCGServer | CasparCGMedia | CasparCGTemplate

export { GDDSchema }

export interface CasparCGServer extends ResourceBase {
	resourceType: ResourceType.CASPARCG_SERVER

	/** The number of channels the server has */
	channels: number
}
export interface CasparCGMedia extends ResourceBase {
	resourceType: ResourceType.CASPARCG_MEDIA

	type: 'image' | 'video' | 'audio'
	name: string
	size: number
	changed: number
	frames: number
	frameTime: string
	frameRate: number
	duration: number
	thumbnail?: string

	// prefilled data:
	channel?: number
	layer?: number
}

export interface CasparCGTemplate extends ResourceBase {
	resourceType: ResourceType.CASPARCG_TEMPLATE

	name: string
	size: number
	changed: number

	// prefilled data:
	useStopCommand?: boolean
	duration?: number | null
	data?: any
	sendDataAsXML?: boolean
	channel?: number
	layer?: number

	gdd?: GDDSchema
}
