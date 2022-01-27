import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever } from './lib'

enum GeneralResourceType {
	MEDIA = 'media',
	TEMPLATE = 'template',
	UNKNOWN = 'unknown',
}

export function describeResource(resource: ResourceAny) {
	switch (resource.resourceType) {
		case ResourceType.CASPARCG_MEDIA:
			return GeneralResourceType.MEDIA
		case ResourceType.CASPARCG_TEMPLATE:
			return GeneralResourceType.TEMPLATE
		case ResourceType.CASPARCG_SERVER:
			return GeneralResourceType.UNKNOWN
		default:
			assertNever(resource)
			return GeneralResourceType.UNKNOWN
	}
}
