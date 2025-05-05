import { ResourceBase, ResourceType } from './resource.js'

export type OBSAny =
	| OBSScene
	| OBSTransition
	| OBSRecording
	| OBSStreaming
	| OBSInputSettings
	| OBSInputAudio
	| OBSInputMedia
	| OBSRender

export interface OBSScene extends ResourceBase {
	resourceType: ResourceType.OBS_SCENE

	name: string
}

export interface OBSTransition extends ResourceBase {
	resourceType: ResourceType.OBS_TRANSITION

	name: string
}

export interface OBSRecording extends ResourceBase {
	resourceType: ResourceType.OBS_RECORDING
}

export interface OBSStreaming extends ResourceBase {
	resourceType: ResourceType.OBS_STREAMING
}

export interface OBSInputSettings extends ResourceBase {
	resourceType: ResourceType.OBS_INPUT_SETTINGS
	input: string
}

export interface OBSInputAudio extends ResourceBase {
	resourceType: ResourceType.OBS_INPUT_AUDIO
	input: string
}

export interface OBSInputMedia extends ResourceBase {
	resourceType: ResourceType.OBS_INPUT_MEDIA
	input: string
}

export interface OBSRender extends ResourceBase {
	resourceType: ResourceType.OBS_RENDER
}
