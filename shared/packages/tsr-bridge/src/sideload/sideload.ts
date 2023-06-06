import { ResourceAny, MetadataAny } from '@shared/models'

export interface SideLoadDevice {
	refreshResourcesAndMetadata: () => Promise<{ resources: ResourceAny[]; metadata: MetadataAny }>
	close: () => Promise<void>
}
