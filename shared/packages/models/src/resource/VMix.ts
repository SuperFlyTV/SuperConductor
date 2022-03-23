import { ResourceBase, ResourceType } from './resource'

export type VMixAny =
	| VMixInput
	| VMixInputSettings
	| VMixAudioSettings
	| VMixOutputSettings
	| VMixOverlaySettings
	| VMixRecording
	| VMixStreaming
	| VMixExternal
	| VMixFadeToBlack
	| VMixFader

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

export interface VMixOverlaySettings extends ResourceBase {
	resourceType: ResourceType.VMIX_OVERLAY_SETTINGS
}

export interface VMixRecording extends ResourceBase {
	resourceType: ResourceType.VMIX_RECORDING
}

export interface VMixStreaming extends ResourceBase {
	resourceType: ResourceType.VMIX_STREAMING
}

export interface VMixExternal extends ResourceBase {
	resourceType: ResourceType.VMIX_EXTERNAL
}

export interface VMixFadeToBlack extends ResourceBase {
	resourceType: ResourceType.VMIX_FADE_TO_BLACK
}

export interface VMixFader extends ResourceBase {
	resourceType: ResourceType.VMIX_FADER
}
