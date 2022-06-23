import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import { ResourceAny } from '@shared/models'
import _ from 'lodash'
import { ClientSideLogger } from '../api/logger'

export interface Resources {
	[resourceId: string]: ResourceAny
}

export interface RefreshStatuses {
	[deviceId: string]: boolean
}

export class ResourcesStore {
	resources: Resources = {}
	refreshStatuses: RefreshStatuses = {}

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	constructor(init?: Resources) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateResources: (resources) => this.updateResources(resources),
			updateDeviceRefreshStatus: (deviceId, refreshing) => this._updateDeviceRefreshStatus(deviceId, refreshing),
		})
		makeAutoObservable(this)

		if (init) {
			this._update(init)
		}
	}

	public updateResources(resources: Array<{ id: string; resource: ResourceAny | null }>) {
		for (const { id, resource } of resources) {
			this._updateResource(id, resource)
		}
	}
	public isAnyDeviceRefreshing(): boolean {
		for (const deviceId in this.refreshStatuses) {
			const isRefreshing = this.refreshStatuses[deviceId]
			if (isRefreshing) {
				return true
			}
		}

		return false
	}
	private _updateResource(resourceId: string, resource: ResourceAny | null) {
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

	private _update(data: Resources) {
		this.resources = data
	}

	private _updateDeviceRefreshStatus(deviceId: string, refreshing: boolean) {
		this.refreshStatuses[deviceId] = refreshing
	}
}
