import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import { ResourceAny } from '@shared/models'
import { ClientSideLogger } from '../api/logger'
import { hashObj } from '../../lib/util'

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

	private resourceHashes: { [resourceId: string]: string } // Not defined here, this should not be an observable

	constructor(init?: Resources) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateResources: (resources) => this.updateResources(resources),
			updateDeviceRefreshStatus: (deviceId, refreshing) => this._updateDeviceRefreshStatus(deviceId, refreshing),
		})

		makeAutoObservable(this)

		this.resourceHashes = {}

		if (init) {
			this._update(init)
		}
	}

	public updateResources(resources: Array<{ id: string; resource: ResourceAny | null }>) {
		const newResources = { ...this.resources }

		for (const { id, resource } of resources) {
			const resourceHash = hashObj(resource)

			if (resource) {
				const existingHash = this.resourceHashes[id]
				if (existingHash !== resourceHash) {
					newResources[id] = resource
					this.resourceHashes[id] = resourceHash
				}
			} else {
				if (this.resources[id]) {
					delete newResources[id]
					delete this.resourceHashes[id]
				}
			}
		}
		this.resources = newResources
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

	private _update(data: Resources) {
		this.resources = data
	}

	private _updateDeviceRefreshStatus(deviceId: string, refreshing: boolean) {
		this.refreshStatuses[deviceId] = refreshing
	}
}
