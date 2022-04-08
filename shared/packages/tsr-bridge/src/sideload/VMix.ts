import winston from 'winston'
import { DeviceOptionsVMix } from 'timeline-state-resolver'
import { VMix } from 'timeline-state-resolver/dist/devices/vmixAPI'
import {
	ResourceAny,
	ResourceType,
	VMixInput,
	VMixInputSettings,
	VMixAudioSettings,
	VMixOutputSettings,
	VMixOverlaySettings,
	VMixRecording,
	VMixStreaming,
	VMixExternal,
	VMixFadeToBlack,
	VMixFader,
	VMixPreview,
} from '@shared/models'
import { SideLoadDevice } from './sideload'

export class VMixSideload implements SideLoadDevice {
	private vmix: VMix
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: { [id: string]: ResourceAny } = {}

	constructor(
		private deviceId: string,
		private deviceOptions: DeviceOptionsVMix,
		private log: winston.Logger | Console
	) {
		this.vmix = new VMix()

		this.vmix.on('connected', () => {
			this.log.info(`vMix ${this.deviceId}: Sideload connection initialized`)
		})
		this.vmix.on('disconnected', () => {
			this.log.info(`vMix ${this.deviceId}: Sideload connection disconnected`)
		})

		if (deviceOptions.options?.host && deviceOptions.options?.port) {
			this.vmix
				.connect({
					host: deviceOptions.options.host,
					port: deviceOptions.options.port,
				})
				.catch((error) => this.log.error(error))
		}
	}
	refreshResources() {
		return this._refreshResources()
	}
	async close() {
		return this.vmix.dispose()
	}
	private async _refreshResources() {
		const resources: { [id: string]: ResourceAny } = {}

		if (!this.vmix.connected) {
			return Object.values(resources)
		}

		// Inputs
		for (const key in this.vmix.state.inputs) {
			const input = this.vmix.state.inputs[key]
			if (typeof input.number !== 'undefined' && typeof input.type !== 'undefined') {
				const resource: VMixInput = {
					resourceType: ResourceType.VMIX_INPUT,
					deviceId: this.deviceId,
					id: `${this.deviceId}_input_${key}`,
					number: input.number,
					type: input.type,
					displayName: `Input ${input.number}`,
				}
				resources[resource.id] = resource
			}
		}

		// Input Settings
		{
			const resource: VMixInputSettings = {
				resourceType: ResourceType.VMIX_INPUT_SETTINGS,
				deviceId: this.deviceId,
				id: `${this.deviceId}_input_settings`,
				displayName: 'Input Settings',
			}
			resources[resource.id] = resource
		}

		// Recording
		{
			const resource: VMixRecording = {
				resourceType: ResourceType.VMIX_RECORDING,
				deviceId: this.deviceId,
				id: `${this.deviceId}_recording`,
				displayName: 'Recording',
			}
			resources[resource.id] = resource
		}

		// Streaming
		{
			const resource: VMixStreaming = {
				resourceType: ResourceType.VMIX_STREAMING,
				deviceId: this.deviceId,
				id: `${this.deviceId}_streaming`,
				displayName: 'Streaming',
			}
			resources[resource.id] = resource
		}

		// Audio Settings
		{
			const resource: VMixAudioSettings = {
				resourceType: ResourceType.VMIX_AUDIO_SETTINGS,
				deviceId: this.deviceId,
				id: `${this.deviceId}_audio_settings`,
				displayName: 'Audio Settings',
			}
			resources[resource.id] = resource
		}

		// Fader
		{
			const resource: VMixFader = {
				resourceType: ResourceType.VMIX_FADER,
				deviceId: this.deviceId,
				id: `${this.deviceId}_fader`,
				displayName: 'Transition Fader',
			}
			resources[resource.id] = resource
		}

		// Preview
		{
			const resource: VMixPreview = {
				resourceType: ResourceType.VMIX_PREVIEW,
				deviceId: this.deviceId,
				id: `${this.deviceId}_preview`,
				displayName: 'Preview',
			}
			resources[resource.id] = resource
		}

		// Output Settings
		{
			const resource: VMixOutputSettings = {
				resourceType: ResourceType.VMIX_OUTPUT_SETTINGS,
				deviceId: this.deviceId,
				id: `${this.deviceId}_output_settings`,
				displayName: 'Output Settings',
			}
			resources[resource.id] = resource
		}

		// Overlay Settings
		{
			const resource: VMixOverlaySettings = {
				resourceType: ResourceType.VMIX_OVERLAY_SETTINGS,
				deviceId: this.deviceId,
				id: `${this.deviceId}_overlay_settings`,
				displayName: 'Overlay Settings',
			}
			resources[resource.id] = resource
		}

		// Externals
		{
			const resource: VMixExternal = {
				resourceType: ResourceType.VMIX_EXTERNAL,
				deviceId: this.deviceId,
				id: `${this.deviceId}_external`,
				displayName: 'External Output Settings',
			}
			resources[resource.id] = resource
		}

		// Fade To Black
		{
			const resource: VMixFadeToBlack = {
				resourceType: ResourceType.VMIX_FADE_TO_BLACK,
				deviceId: this.deviceId,
				id: `${this.deviceId}_fade_to_black`,
				displayName: 'Fade To Black',
			}
			resources[resource.id] = resource
		}

		return Object.values(resources)
	}
}
