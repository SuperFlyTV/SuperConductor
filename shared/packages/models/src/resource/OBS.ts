import { ResourceBase, ResourceType } from './resource'

export type OBSAny = OBSScene

export interface OBSScene extends ResourceBase {
	resourceType: ResourceType.OBS_SCENE

	name: string
}
