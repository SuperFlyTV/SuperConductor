import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import { protectString, ResourceAny, ResourceId } from '@shared/models'
import { ClientSideLogger } from '../api/logger'
import { hashObj } from '../../lib/util'

export type Resources = Map<ResourceId, ResourceAny>

export interface RefreshStatuses {
	[deviceId: string]: boolean
}

export class ResourcesStore {
	resources: Resources = new Map()
	refreshStatuses: RefreshStatuses = {}

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	private resourceHashes: Map<ResourceId, string> // Not defined here, this should not be an observable

	constructor(init?: Resources) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateResources: (resources) => this.updateResources(resources),
			updateDeviceRefreshStatus: (deviceId, refreshing) => this._updateDeviceRefreshStatus(deviceId, refreshing),
		})

		makeAutoObservable(this)

		this.resourceHashes = new Map()

		if (init) {
			this._update(init)
		}
	}

	public updateResources(resources: Array<{ id: string; resource: ResourceAny | null }>): void {
		const newResources: Map<ResourceId, ResourceAny> = new Map(this.resources.entries())

		for (const { id: id0, resource } of resources) {
			const id = protectString<ResourceId>(id0)
			const resourceHash = hashObj(resource)

			if (resource) {
				const existingHash = this.resourceHashes.get(id)
				if (existingHash !== resourceHash) {
					newResources.set(id, resource)
					this.resourceHashes.set(id, resourceHash)
				}
			} else {
				if (this.resources.get(id)) {
					newResources.delete(id)
					this.resourceHashes.delete(id)
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
	public getResource(resourceId: ResourceId): ResourceAny | undefined {
		return this.resources.get(resourceId)
	}

	private _update(data: Resources) {
		this.resources = data
	}

	private _updateDeviceRefreshStatus(deviceId: string, refreshing: boolean) {
		this.refreshStatuses[deviceId] = refreshing
	}
}
