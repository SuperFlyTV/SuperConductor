import { ResourceAny } from '@shared/models'

export interface SideLoadDevice {
	refreshResources: () => Promise<ResourceAny[]>
	close: () => Promise<void>
}
