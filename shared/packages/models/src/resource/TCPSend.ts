import { ResourceBase, ResourceType } from './resource'

export type TCPSendAny = TCPRequest

export interface TCPRequest extends ResourceBase {
	resourceType: ResourceType.TCP_REQUEST
}
