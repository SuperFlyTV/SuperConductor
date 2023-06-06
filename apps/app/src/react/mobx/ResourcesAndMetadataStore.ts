import { makeAutoObservable } from 'mobx'
import { IPCServer } from '../api/IPCServer'
const { ipcRenderer } = window.require('electron')
import { IPCClient } from '../api/IPCClient'
import {
	MetadataAny,
	ResourceAny,
	ResourceId,
	SerializedProtectedMap,
	TSRDeviceId,
	deserializeProtectedMap,
} from '@shared/models'
import { ClientSideLogger } from '../api/logger'
import { hashObj } from '../../lib/util'

export type Resources = Map<ResourceId, ResourceAny>

export type Metadata = Map<TSRDeviceId, MetadataAny>

export class ResourcesAndMetadataStore {
	resources: Resources = new Map()
	metadata: Metadata = new Map()
	refreshStatuses = new Set<TSRDeviceId>()

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	private resourceHashes: Map<ResourceId, string> // Not defined here, this should not be an observable
	private metadataHashes: Map<TSRDeviceId, string> // Not defined here, this should not be an observable

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
		metadata: SerializedProtectedMap<TSRDeviceId, MetadataAny | null>
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
			for (const [deviceId, deviceMetadata] of deserializeProtectedMap<TSRDeviceId, MetadataAny | null>(
				metadata
			).entries()) {
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
		return this.refreshStatuses.size > 0
	}
	public getResource(resourceId: ResourceId): ResourceAny | undefined {
		return this.resources.get(resourceId)
	}
	public getMetadata(deviceId: TSRDeviceId): MetadataAny | undefined {
		return this.metadata.get(deviceId)
	}

	private _update(data: Resources) {
		this.resources = data
	}

	private _updateDeviceRefreshStatus(deviceId: TSRDeviceId, refreshing: boolean) {
		if (refreshing) this.refreshStatuses.add(deviceId)
		else this.refreshStatuses.delete(deviceId)
	}
}
