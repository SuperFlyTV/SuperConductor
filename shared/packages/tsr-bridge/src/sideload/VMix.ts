import { DeviceOptionsVMix } from 'timeline-state-resolver'
import { VMix } from 'timeline-state-resolver/dist/integrations/vmix/connection'
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
	ResourceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { generateResourceId, stringifyError } from '@shared/lib'

export class VMixSideload implements SideLoadDevice {
	private vmix: VMix
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()

	constructor(private deviceId: string, private deviceOptions: DeviceOptionsVMix, private log: LoggerLike) {
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
				.catch((error) => this.log.error('VMix Connect error: ' + stringifyError(error)))
		}
	}
	public async refreshResources(): Promise<ResourceAny[]> {
		return this._refreshResources()
	}
	async close(): Promise<void> {
		return this.vmix.dispose()
	}
	private async _refreshResources() {
		const resources: Map<ResourceId, ResourceAny> = new Map()

		if (!this.vmix.connected) {
			return Array.from(resources.values())
		}

		// Inputs
		for (const key in this.vmix.state.inputs) {
			const input = this.vmix.state.inputs[key]
			if (typeof input.number !== 'undefined' && typeof input.type !== 'undefined') {
				const resource: VMixInput = {
					resourceType: ResourceType.VMIX_INPUT,
					deviceId: this.deviceId,
					id: generateResourceId(this.deviceId, ResourceType.VMIX_INPUT, key),
					number: input.number,
					type: input.type,
					displayName: `Input ${input.number}`,
				}
				resources.set(resource.id, resource)
			}
		}

		// Input Settings
		{
			const resource: VMixInputSettings = {
				resourceType: ResourceType.VMIX_INPUT_SETTINGS,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_INPUT_SETTINGS, 0),
				displayName: 'Input Settings',
			}
			resources.set(resource.id, resource)
		}

		// Recording
		{
			const resource: VMixRecording = {
				resourceType: ResourceType.VMIX_RECORDING,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_RECORDING, 0),
				displayName: 'Recording',
			}
			resources.set(resource.id, resource)
		}

		// Streaming
		{
			const resource: VMixStreaming = {
				resourceType: ResourceType.VMIX_STREAMING,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_STREAMING, 0),
				displayName: 'Streaming',
			}
			resources.set(resource.id, resource)
		}

		// Audio Settings
		{
			const resource: VMixAudioSettings = {
				resourceType: ResourceType.VMIX_AUDIO_SETTINGS,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_AUDIO_SETTINGS, 0),
				displayName: 'Audio Settings',
			}
			resources.set(resource.id, resource)
		}

		// Fader
		{
			const resource: VMixFader = {
				resourceType: ResourceType.VMIX_FADER,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_FADER, 0),
				displayName: 'Transition Fader',
			}
			resources.set(resource.id, resource)
		}

		// Preview
		{
			const resource: VMixPreview = {
				resourceType: ResourceType.VMIX_PREVIEW,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_PREVIEW, 0),
				displayName: 'Preview',
			}
			resources.set(resource.id, resource)
		}

		// Output Settings
		{
			const resource: VMixOutputSettings = {
				resourceType: ResourceType.VMIX_OUTPUT_SETTINGS,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_OUTPUT_SETTINGS, 0),
				displayName: 'Output Settings',
			}
			resources.set(resource.id, resource)
		}

		// Overlay Settings
		{
			const resource: VMixOverlaySettings = {
				resourceType: ResourceType.VMIX_OVERLAY_SETTINGS,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_OVERLAY_SETTINGS, 0),
				displayName: 'Overlay Settings',
			}
			resources.set(resource.id, resource)
		}

		// Externals
		{
			const resource: VMixExternal = {
				resourceType: ResourceType.VMIX_EXTERNAL,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_EXTERNAL, 0),
				displayName: 'External Output Settings',
			}
			resources.set(resource.id, resource)
		}

		// Fade To Black
		{
			const resource: VMixFadeToBlack = {
				resourceType: ResourceType.VMIX_FADE_TO_BLACK,
				deviceId: this.deviceId,
				id: generateResourceId(this.deviceId, ResourceType.VMIX_FADE_TO_BLACK, 0),
				displayName: 'Fade To Black',
			}
			resources.set(resource.id, resource)
		}

		return Array.from(resources.values())
	}
}
