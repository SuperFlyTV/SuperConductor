import { ResourceBase, ResourceType } from './resource'

export type OBSAny = OBSScene | OBSTransition

export interface OBSScene extends ResourceBase {
	resourceType: ResourceType.OBS_SCENE

	name: string
}

export interface OBSTransition extends ResourceBase {
	resourceType: ResourceType.OBS_TRANSITION

	name: string
}
