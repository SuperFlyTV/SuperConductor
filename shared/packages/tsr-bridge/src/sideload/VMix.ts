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
	protectString,
	VMixMetadata,
	MetadataAny,
	MetadataType,
	TSRDeviceId,
} from '@shared/models'
import { SideLoadDevice } from './sideload'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource, stringifyError } from '@shared/lib'

export class VMixSideload implements SideLoadDevice {
	private vmix: VMix
	/** A cache of resources to be used when the device is offline. */
	private cacheResources: Map<ResourceId, ResourceAny> = new Map()
	private cacheMetadata: VMixMetadata = { metadataType: MetadataType.VMIX }

	constructor(private deviceId: TSRDeviceId, private deviceOptions: DeviceOptionsVMix, private log: LoggerLike) {
		this.vmix = new VMix()

		this.vmix.on('connected', () => {
			this.log.info(`vMix ${this.deviceId}: Sideload connection initialized`)
		})
		this.vmix.on('disconnected', () => {
			this.log.info(`vMix ${this.deviceId}: Sideload connection disconnected`)
		})

		if (this.deviceOptions.options?.host && this.deviceOptions.options?.port) {
			this.vmix
				.connect({
					host: this.deviceOptions.options.host,
					port: this.deviceOptions.options.port,
				})
				.catch((error) => this.log.error('VMix Connect error: ' + stringifyError(error)))
		}
	}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		return this.vmix.dispose()
	}
	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: VMixMetadata = { metadataType: MetadataType.VMIX }

		if (!this.vmix.connected) {
			return {
				resources: Array.from(resources.values()),
				metadata,
			}
		}

		// Inputs
		for (const key in this.vmix.state.inputs) {
			const input = this.vmix.state.inputs[key]
			if (typeof input.number !== 'undefined' && typeof input.type !== 'undefined') {
				const resource: VMixInput = {
					resourceType: ResourceType.VMIX_INPUT,
					deviceId: this.deviceId,
					id: protectString(''), // set by getResourceIdFromResource() later
					number: input.number,
					type: input.type,
					displayName: `Input ${input.number}`,
				}
				resource.id = getResourceIdFromResource(resource)
				resources.set(resource.id, resource)
			}
		}

		// Input Settings
		{
			const resource: VMixInputSettings = {
				resourceType: ResourceType.VMIX_INPUT_SETTINGS,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Input Settings',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Recording
		{
			const resource: VMixRecording = {
				resourceType: ResourceType.VMIX_RECORDING,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Recording',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Streaming
		{
			const resource: VMixStreaming = {
				resourceType: ResourceType.VMIX_STREAMING,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Streaming',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Audio Settings
		{
			const resource: VMixAudioSettings = {
				resourceType: ResourceType.VMIX_AUDIO_SETTINGS,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Audio Settings',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Fader
		{
			const resource: VMixFader = {
				resourceType: ResourceType.VMIX_FADER,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Transition Fader',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Preview
		{
			const resource: VMixPreview = {
				resourceType: ResourceType.VMIX_PREVIEW,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Preview',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Output Settings
		{
			const resource: VMixOutputSettings = {
				resourceType: ResourceType.VMIX_OUTPUT_SETTINGS,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Output Settings',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Overlay Settings
		{
			const resource: VMixOverlaySettings = {
				resourceType: ResourceType.VMIX_OVERLAY_SETTINGS,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Overlay Settings',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Externals
		{
			const resource: VMixExternal = {
				resourceType: ResourceType.VMIX_EXTERNAL,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'External Output Settings',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Fade To Black
		{
			const resource: VMixFadeToBlack = {
				resourceType: ResourceType.VMIX_FADE_TO_BLACK,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				displayName: 'Fade To Black',
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		return {
			resources: Array.from(resources.values()),
			metadata,
		}
	}
}
