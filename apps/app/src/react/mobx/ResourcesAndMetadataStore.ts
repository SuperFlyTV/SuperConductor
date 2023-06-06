import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import { MetadataAny, ResourceAny, ResourceId } from '@shared/models'
import { ClientSideLogger } from '../api/logger'
import { hashObj } from '../../lib/util'

export type Resources = Map<ResourceId, ResourceAny>

/** maps deviceId -> MetadataAny */
export type Metadata = Map<string, MetadataAny>

export interface RefreshStatuses {
	[deviceId: string]: boolean
}

export class ResourcesAndMetadataStore {
	resources: Resources = new Map()
	metadata: Metadata = new Map()
	refreshStatuses: RefreshStatuses = {}

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	private resourceHashes: Map<ResourceId, string> // Not defined here, this should not be an observable
	private metadataHashes: Map<string, string> // Not defined here, this should not be an observable

	constructor(init?: Resources) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateResourcesAndMetadata: (resources, metadata) => this.updateResourcesAndMetadata(resources, metadata),
			updateDeviceRefreshStatus: (deviceId, refreshing) => this._updateDeviceRefreshStatus(deviceId, refreshing),
		})

		makeAutoObservable(this)

		this.resourceHashes = new Map()
		this.metadataHashes = new Map()

		if (init) {
			this._update(init)
		}
	}

	public updateResourcesAndMetadata(
		resources: Array<{ id: ResourceId; resource: ResourceAny | null }>,
		metadata: { [deviceId: string]: MetadataAny | null }
	): void {
		// Resources:
		{
			for (const { id, resource } of resources) {
				const resourceHash = hashObj(resource)

				if (resource) {
					const existingHash = this.resourceHashes.get(id)
					if (existingHash !== resourceHash) {
						this.resources.set(id, resource)
						this.resourceHashes.set(id, resourceHash)
					}
				} else {
					if (this.resources.has(id)) {
						this.resources.delete(id)
						this.resourceHashes.delete(id)
					}
				}
			}
		}

		// Metadata:
		{
			for (const [deviceId, deviceMetadata] of Object.entries(metadata)) {
				const metadataHash = hashObj(deviceMetadata)

				if (deviceMetadata) {
					const existingHash = this.metadataHashes.get(deviceId)
					if (existingHash !== metadataHash) {
						this.metadata.set(deviceId, deviceMetadata)
						this.metadataHashes.set(deviceId, metadataHash)
					}
				} else {
					if (this.metadata.has(deviceId)) {
						this.metadata.delete(deviceId)
						this.metadataHashes.delete(deviceId)
					}
				}
			}
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
	public getResource(resourceId: ResourceId): ResourceAny | undefined {
		return this.resources.get(resourceId)
	}
	public getMetadata(deviceId: string): MetadataAny | undefined {
		return this.metadata.get(deviceId)
	}

	private _update(data: Resources) {
		this.resources = data
	}

	private _updateDeviceRefreshStatus(deviceId: string, refreshing: boolean) {
		this.refreshStatuses[deviceId] = refreshing
	}
}
