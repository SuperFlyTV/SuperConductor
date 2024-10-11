import { DeviceOptionsTriCaster } from 'timeline-state-resolver'
import {
	TriCasterConnection,
	TriCasterInfo,
	// eslint-disable-next-line n/no-missing-import
} from 'timeline-state-resolver/dist/integrations/tricaster/triCasterConnection.js'
import {
	ResourceAny,
	ResourceType,
	ResourceId,
	protectString,
	MetadataAny,
	MetadataType,
	TSRDeviceId,
	TriCasterMetadata,
	TriCasterInput,
	TriCasterMe,
	TriCasterDsk,
	TriCasterMixOutput,
	TriCasterAudioChannel,
	TriCasterMatrixOutput,
} from '@shared/models'
import { SideLoadDevice } from './sideload.js'
import { LoggerLike } from '@shared/api'
import { getResourceIdFromResource, stringifyError } from '@shared/lib'

const SPECIAL_AUDIO_CHANNELS = ['sound', 'master']

export class TriCasterSideload implements SideLoadDevice {
	private triCaster: TriCasterConnection
	private info?: TriCasterInfo

	constructor(private deviceId: TSRDeviceId, private deviceOptions: DeviceOptionsTriCaster, private log: LoggerLike) {
		this.triCaster = new TriCasterConnection(deviceOptions.options?.host ?? '', deviceOptions.options?.port ?? 80)

		this.triCaster.on('connected', (info) => {
			this.info = info
			this.log.info(`TriCaster ${this.deviceId}: Sideload connection initialized`)
		})

		if (this.deviceOptions.options?.host && this.deviceOptions.options?.port) {
			try {
				this.triCaster.connect()
			} catch (error) {
				this.log.error(stringifyError(error))
			}
		}
	}
	public async refreshResourcesAndMetadata(): Promise<{ resources: ResourceAny[]; metadata: MetadataAny }> {
		return this._refreshResourcesAndMetadata()
	}
	async close(): Promise<void> {
		return this.triCaster.close()
	}
	private async _refreshResourcesAndMetadata() {
		const resources: Map<ResourceId, ResourceAny> = new Map()
		const metadata: TriCasterMetadata = { metadataType: MetadataType.TRICASTER }

		if (!this.info) {
			return {
				resources: Array.from(resources.values()),
				metadata: metadata,
			}
		}

		// Inputs
		for (let i = 1; i <= this.info.inputCount; ++i) {
			const resource: TriCasterInput = {
				resourceType: ResourceType.TRICASTER_INPUT,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name: `input${i}`,
				displayName: `TriCaster Input ${i}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Audio Channels
		SPECIAL_AUDIO_CHANNELS.forEach((name) => {
			const resource: TriCasterAudioChannel = {
				resourceType: ResourceType.TRICASTER_AUDIO_CHANNEL,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name,
				displayName: `TriCaster Audio Channel ${name}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		})
		for (let i = 1; i <= this.info.inputCount; ++i) {
			const resource: TriCasterAudioChannel = {
				resourceType: ResourceType.TRICASTER_AUDIO_CHANNEL,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name: `input${i}`,
				displayName: `TriCaster Audio Channel Input ${i}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}
		for (let i = 1; i <= this.info.ddrCount; ++i) {
			const resource: TriCasterAudioChannel = {
				resourceType: ResourceType.TRICASTER_AUDIO_CHANNEL,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name: `ddr${i}`,
				displayName: `TriCaster Audio Channel DDR ${i}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// MEs
		const resource: TriCasterMe = {
			resourceType: ResourceType.TRICASTER_ME,
			deviceId: this.deviceId,
			id: protectString(''), // set by getResourceIdFromResource() later
			name: 'main',
			displayName: `TriCaster Main ME`,
		}
		resource.id = getResourceIdFromResource(resource)
		resources.set(resource.id, resource)
		for (let i = 1; i <= this.info.meCount; ++i) {
			const resource: TriCasterMe = {
				resourceType: ResourceType.TRICASTER_ME,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name: `v${i}`,
				displayName: `TriCaster ME ${i}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// DSKs
		for (let i = 1; i <= this.info.dskCount; ++i) {
			const resource: TriCasterDsk = {
				resourceType: ResourceType.TRICASTER_DSK,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name: `dsk${i}`,
				displayName: `TriCaster DSK ${i}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Mix Outputs
		for (let i = 1; i <= this.info.outputCount; ++i) {
			const resource: TriCasterMixOutput = {
				resourceType: ResourceType.TRICASTER_MIX_OUTPUT,
				deviceId: this.deviceId,
				id: protectString(''), // set by getResourceIdFromResource() later
				name: `mix${i}`,
				displayName: `TriCaster Mix Out ${i}`,
			}
			resource.id = getResourceIdFromResource(resource)
			resources.set(resource.id, resource)
		}

		// Matrix Outputs
		// TODO: find a better source for the matrix out count. AFAIK only TC2ELITE has them ATM, but this may change
		if (this.info.productModel === 'TC2ELITE') {
			for (let i = 1; i <= 8; ++i) {
				const resource: TriCasterMatrixOutput = {
					resourceType: ResourceType.TRICASTER_MATRIX_OUTPUT,
					deviceId: this.deviceId,
					id: protectString(''), // set by getResourceIdFromResource() later
					name: `mix${i}`,
					displayName: `TriCaster Matrix Out ${i}`,
				}
				resource.id = getResourceIdFromResource(resource)
				resources.set(resource.id, resource)
			}
		}

		return {
			resources: Array.from(resources.values()),
			metadata,
		}
	}
}
