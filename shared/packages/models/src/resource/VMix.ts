import { ResourceBase, ResourceType } from './resource'

export type VMixAny = VMixInput | VMixInputSettings

export interface VMixInput extends ResourceBase {
	resourceType: ResourceType.VMIX_INPUT

	number: number
	type: string
}

export interface VMixInputSettings extends ResourceBase {
	resourceType: ResourceType.VMIX_INPUT_SETTINGS
}
