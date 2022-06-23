import { ResourceBase, ResourceType } from './resource'

export type HTTPSendAny = HTTPRequest

export interface HTTPRequest extends ResourceBase {
	resourceType: ResourceType.HTTP_REQUEST
}
