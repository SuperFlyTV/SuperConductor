import { ResourceBase, ResourceType } from './resource'

export type AtemAny = AtemMe

export interface AtemMe extends ResourceBase {
	resourceType: ResourceType.ATEM_ME

	/** The 0-based index of the ME */
	index: number

	name: string
}
