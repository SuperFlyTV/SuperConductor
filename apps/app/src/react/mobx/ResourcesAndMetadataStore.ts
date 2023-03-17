import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import { MetadataAny, ResourceAny } from '@shared/models'
import { ClientSideLogger } from '../api/logger'
import { hashObj } from '../../lib/util'

export interface Resources {
	[resourceId: string]: ResourceAny
}

export interface Metadata {
	[deviceId: string]: MetadataAny
}

export interface RefreshStatuses {
	[deviceId: string]: boolean
}

export class ResourcesAndMetadataStore {
	resources: Resources = {}
	metadata: Metadata = {}
	refreshStatuses: RefreshStatuses = {}

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	private resourceHashes: { [resourceId: string]: string } // Not defined here, this should not be an observable
	private metadataHashes: { [deviceId: string]: string } // Not defined here, this should not be an observable

	constructor(init?: Resources) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateResourcesAndMetadata: (resources, metadata) => this.updateResourcesAndMetadata(resources, metadata),
			updateDeviceRefreshStatus: (deviceId, refreshing) => this._updateDeviceRefreshStatus(deviceId, refreshing),
		})

		makeAutoObservable(this)

		this.resourceHashes = {}
		this.metadataHashes = {}

		if (init) {
			this._update(init)
		}
	}

	public updateResourcesAndMetadata(
		resources: Array<{ id: string; resource: ResourceAny | null }>,
		metadata: { [deviceId: string]: MetadataAny | null }
	): void {
		// Resources:
		{
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

		// Metadata:
		{
			const newMetadata = { ...this.metadata }
			for (const [deviceId, deviceMetadata] of Object.entries(metadata)) {
				const metadataHash = hashObj(deviceMetadata)

				if (deviceMetadata) {
					const existingHash = this.metadataHashes[deviceId]
					if (existingHash !== metadataHash) {
						newMetadata[deviceId] = deviceMetadata
						this.metadataHashes[deviceId] = metadataHash
					}
				} else {
					if (this.metadata[deviceId]) {
						delete newMetadata[deviceId]
						delete this.metadataHashes[deviceId]
					}
				}
			}
			this.metadata = newMetadata
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
	public getResource(resourceId: string): ResourceAny | undefined {
		return this.resources[resourceId]
	}
	public getMetadata(deviceId: string): MetadataAny | undefined {
		return this.metadata[deviceId]
	}

	private _update(data: Resources) {
		this.resources = data
	}

	private _updateDeviceRefreshStatus(deviceId: string, refreshing: boolean) {
		this.refreshStatuses[deviceId] = refreshing
	}
}
