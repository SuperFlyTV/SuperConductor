import { ResourceBase, ResourceType } from './resource.js'

export type OSCAny = OSCMessage

export interface OSCMessage extends ResourceBase {
	resourceType: ResourceType.OSC_MESSAGE
}
