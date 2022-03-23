import { ResourceBase, ResourceType } from './resource'

export type VMixAny = VMixInput | VMixInputSettings | VMixAudioSettings | VMixOutputSettings

export interface VMixInput extends ResourceBase {
	resourceType: ResourceType.VMIX_INPUT

	number: number
	type: string
}

export interface VMixInputSettings extends ResourceBase {
	resourceType: ResourceType.VMIX_INPUT_SETTINGS
}

export interface VMixAudioSettings extends ResourceBase {
	resourceType: ResourceType.VMIX_AUDIO_SETTINGS
}

export interface VMixOutputSettings extends ResourceBase {
	resourceType: ResourceType.VMIX_OUTPUT_SETTINGS
}
