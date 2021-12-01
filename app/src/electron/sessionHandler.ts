import EventEmitter from 'events'
import { ResourceAny } from '@/models/resource/resource'

/** This class handles all non-persistant data */
export class SessionHandler extends EventEmitter {
	private resources: { [id: string]: ResourceAny } = {}
	private resourcesHasChanged: { [id: string]: true } = {}

	private emitTimeout: NodeJS.Timeout | null = null

	getResources() {
		return this.resources
	}
	getResource(id: string): ResourceAny | undefined {
		return this.resources[id]
	}
	getResourceIds(deviceId: string): string[] {
		const ids: string[] = []
		for (const [id, resource] of Object.entries(this.resources)) {
			if (resource.deviceId === deviceId) ids.push(id)
		}
		return ids
	}
	updateResource(id: string, resource: ResourceAny | null) {
		if (resource) {
			this.resources[id] = resource
		} else {
			delete this.resources[id]
			this.resourcesHasChanged[id] = true
		}

		this.triggerUpdate()
	}

	private triggerUpdate() {
		if (!this.emitTimeout) {
			this.emitTimeout = setTimeout(() => {
				this.emitTimeout = null
				this.emitChanges()
			}, 5)
		}
	}
	private emitChanges() {
		for (const id of Object.keys(this.resourcesHasChanged)) {
			this.emit('resource', id, this.resources[id] ?? null)
			delete this.resourcesHasChanged[id]
		}
	}
}
