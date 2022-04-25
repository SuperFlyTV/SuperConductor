import { Logger } from 'winston'
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
} from '@shared/models'
import { SideLoadDevice } from './sideload'

export class OBSSideload implements SideLoadDevice {
	private obs: OBSWebsocket
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: { [id: string]: ResourceAny } = {}
	private obsConnected = false
	private obsConnectionRetryTimeout: NodeJS.Timeout | undefined = undefined

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsOBS, private log: Logger) {
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

		this._connect().catch((error) => this.log.error(error))
	}
	refreshResources() {
		return this._refreshResources()
	}
	async close() {
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
				this.log.error(error)
				this._triggerRetryConnection()
			})
		}
	}
	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

		if (!this.obsConnected) {
			return Object.values(this.cacheResources)
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
		return Object.values(resources)
	}
}
