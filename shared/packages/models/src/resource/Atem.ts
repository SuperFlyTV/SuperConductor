import { ResourceBase, ResourceType } from './resource'

export type AtemAny = AtemMe | AtemDsk

export interface AtemMe extends ResourceBase {
	resourceType: ResourceType.ATEM_ME

	/** The 0-based index of the ME */
	index: number

	name: string
}

export interface AtemDsk extends ResourceBase {
	resourceType: ResourceType.ATEM_DSK

	/** The 0-based index of the DSK */
	index: number

	name: string
}
