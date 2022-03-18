import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import { ResourceAny } from '@shared/models'
import _ from 'lodash'

export interface Resources {
	[resourceId: string]: ResourceAny
}

export class ResourcesStore {
	resources: Resources = {}

	serverAPI = new IPCServer(ipcRenderer)
	ipcClient = new IPCClient(ipcRenderer, {
		updateResource: (resourceId, resource) => this.updateResource(resourceId, resource),
	})
	constructor(init?: Resources) {
		makeAutoObservable(this)

		if (init) {
			this.update(init)
		}
	}

	updateResource(resourceId: string, resource: ResourceAny | null) {
		const newResources = { ...this.resources }
		if (resource) {
			if (!_.isEqual(this.resources[resourceId], resource)) {
				newResources[resourceId] = resource
			}
		} else {
			if (this.resources[resourceId]) {
				delete newResources[resourceId]
			}
		}
		this.resources = newResources
	}

	update(data: Resources) {
		this.resources = data
	}
}
