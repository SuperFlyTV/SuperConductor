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
	ResourceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { generateResourceId, stringifyError } from '@shared/lib'

export class OBSSideload implements SideLoadDevice {
	private obs: OBSWebsocket
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()
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
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
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
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

		if (!this.obsConnected) {
			return Array.from(this.cacheResources.values())
		}

		// Scenes and Scene Items
		const { scenes } = await this.obs.send('GetSceneList')
		for (const scene of scenes) {
			const sceneResource: OBSScene = {
				resourceType: ResourceType.OBS_SCENE,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_SCENE, scene.name),
				name: scene.name,
				displayName: `Scene: ${scene.name}`,
			}
			resources.set(sceneResource.id, sceneResource)
		}

		// Transitions
		const { transitions } = await this.obs.send('GetTransitionList')
		for (const transition of transitions) {
			const resource: OBSTransition = {
				resourceType: ResourceType.OBS_TRANSITION,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_TRANSITION, transition.name),
				name: transition.name,
				displayName: `Transition: ${transition.name}`,
			}
			resources.set(resource.id, resource)
		}

		// Recording
		{
			const resource: OBSRecording = {
				resourceType: ResourceType.OBS_RECORDING,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_RECORDING, 0),
				displayName: 'Recording',
			}
			resources.set(resource.id, resource)
		}

		// Streaming
		{
			const resource: OBSStreaming = {
				resourceType: ResourceType.OBS_STREAMING,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_STREAMING, 0),
				displayName: 'Streaming',
			}
			resources.set(resource.id, resource)
		}

		// Mute
		{
			const resource: OBSMute = {
				resourceType: ResourceType.OBS_MUTE,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_MUTE, 0),
				displayName: 'Mute',
			}
			resources.set(resource.id, resource)
		}

		// Render
		{
			const resource: OBSRender = {
				resourceType: ResourceType.OBS_RENDER,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_RENDER, 0),
				displayName: 'Scene Item Render',
			}
			resources.set(resource.id, resource)
		}

		// Source Settings
		{
			const resource: OBSSourceSettings = {
				resourceType: ResourceType.OBS_SOURCE_SETTINGS,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.OBS_SOURCE_SETTINGS, 0),
				displayName: 'Source Settings',
			}
			resources.set(resource.id, resource)
		}

		this.cacheResources = resources
		return Array.from(resources.values())
	}
}
