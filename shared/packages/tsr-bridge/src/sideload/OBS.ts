import { DeviceOptionsOBS } from 'timeline-state-resolver'
import OBSWebsocket from 'obs-websocket-js'
import {
	ResourceAny,
	ResourceType,
	OBSScene,
	OBSTransition,
	OBSRecording,
	OBSStreaming,
	OBSSourceSettings,
	OBSRender,
	OBSMute,
	MetadataAny,
	OBSMetadata,
	MetadataType,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { stringifyError } from '@shared/lib'

export class OBSSideload implements SideLoadDevice {
	private obs: OBSWebsocket
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: { [id: string]: ResourceAny } = {}
	private cacheMetadata: OBSMetadata = { metadataType: MetadataType.OBS }
	private obsConnected = false
	private obsConnectionRetryTimeout: NodeJS.Timeout | undefined = undefined

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsOBS, private log: LoggerLike) {
		this.obs = new OBSWebsocket()

		this.obs.on('ConnectionOpened', () => {
			this.obsConnected = true
			this.log.info(`OBS ${deviceId}: Sideload connection initialized`)
			if (this.obsConnectionRetryTimeout) {
				clearTimeout(this.obsConnectionRetryTimeout)
				this.obsConnectionRetryTimeout = undefined
			}
		})

		this.obs.on('ConnectionClosed', () => {
			this.obsConnected = false
			this.log.info(`OBS ${deviceId}: Sideload connection disconnected`)
			this._triggerRetryConnection()
		})

		this._connect().catch((error) => this.log.error('OBS Connect error: ' + stringifyError(error)))
	}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		return this.obs.disconnect()
	}
	private async _connect() {
		if (this.deviceOptions.options?.host && this.deviceOptions.options?.port) {
			await this.obs.connect({
				address: `${this.deviceOptions.options?.host}:${this.deviceOptions.options?.port}`,
				password: this.deviceOptions.options.password,
			})
		}
	}

	private _triggerRetryConnection() {
		if (!this.obsConnectionRetryTimeout) {
			this.obsConnectionRetryTimeout = setTimeout(() => {
				this._retryConnection()
			}, 5000)
		}
	}

	private _retryConnection() {
		if (this.obsConnectionRetryTimeout) {
			clearTimeout(this.obsConnectionRetryTimeout)
			this.obsConnectionRetryTimeout = undefined
		}

		if (!this.obsConnected) {
			this._connect().catch((error) => {
				this.log.error('OBS Connect error: ' + stringifyError(error))
				this._triggerRetryConnection()
			})
		}
	}
	private async _refreshResourcesAndMetadata() {
		const resources: { [id: string]: ResourceAny } = {}
		const metadata: OBSMetadata = { metadataType: MetadataType.OBS }

		if (!this.obsConnected) {
			return {
				resources: Object.values(this.cacheResources),
				metadata: this.cacheMetadata,
			}
		}

		// Scenes and Scene Items
		const { scenes } = await this.obs.send('GetSceneList')
		for (const scene of scenes) {
			const sceneResource: OBSScene = {
				resourceType: ResourceType.OBS_SCENE,
				deviceId: this.deviceId,
				id: `${this.deviceId}_scene_${scene.name}`,
				name: scene.name,
				displayName: `Scene: ${scene.name}`,
			}
			resources[sceneResource.id] = sceneResource
		}

		// Transitions
		const { transitions } = await this.obs.send('GetTransitionList')
		for (const transition of transitions) {
			const resource: OBSTransition = {
				resourceType: ResourceType.OBS_TRANSITION,
				deviceId: this.deviceId,
				id: `${this.deviceId}_transition_${transition.name}`,
				name: transition.name,
				displayName: `Transition: ${transition.name}`,
			}
			resources[resource.id] = resource
		}

		// Recording
		{
			const resource: OBSRecording = {
				resourceType: ResourceType.OBS_RECORDING,
				deviceId: this.deviceId,
				id: `${this.deviceId}_recording`,
				displayName: 'Recording',
			}
			resources[resource.id] = resource
		}

		// Streaming
		{
			const resource: OBSStreaming = {
				resourceType: ResourceType.OBS_STREAMING,
				deviceId: this.deviceId,
				id: `${this.deviceId}_streaming`,
				displayName: 'Streaming',
			}
			resources[resource.id] = resource
		}

		// Mute
		{
			const resource: OBSMute = {
				resourceType: ResourceType.OBS_MUTE,
				deviceId: this.deviceId,
				id: `${this.deviceId}_mute`,
				displayName: 'Mute',
			}
			resources[resource.id] = resource
		}

		// Render
		{
			const resource: OBSRender = {
				resourceType: ResourceType.OBS_RENDER,
				deviceId: this.deviceId,
				id: `${this.deviceId}_render`,
				displayName: 'Scene Item Render',
			}
			resources[resource.id] = resource
		}

		// Source Settings
		{
			const resource: OBSSourceSettings = {
				resourceType: ResourceType.OBS_SOURCE_SETTINGS,
				deviceId: this.deviceId,
				id: `${this.deviceId}_source_settings`,
				displayName: 'Source Settings',
			}
			resources[resource.id] = resource
		}

		this.cacheResources = resources
		this.cacheMetadata = metadata
		return {
			resources: Object.values(resources),
			metadata,
		}
	}
}
