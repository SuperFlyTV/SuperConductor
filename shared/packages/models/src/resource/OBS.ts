import { ResourceBase, ResourceType } from './resource.js'

export type OBSAny = OBSScene | OBSTransition | OBSRecording | OBSStreaming | OBSSourceSettings | OBSMute | OBSRender

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

export interface OBSSourceSettings extends ResourceBase {
	resourceType: ResourceType.OBS_SOURCE_SETTINGS
}

export interface OBSMute extends ResourceBase {
	resourceType: ResourceType.OBS_MUTE
}

export interface OBSRender extends ResourceBase {
	resourceType: ResourceType.OBS_RENDER
}
