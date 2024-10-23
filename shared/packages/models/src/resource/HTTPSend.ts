import { ResourceBase, ResourceType } from './resource.js'

export type HTTPSendAny = HTTPRequest

export interface HTTPRequest extends ResourceBase {
	resourceType: ResourceType.HTTP_REQUEST
}
