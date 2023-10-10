import { ResourceBase, ResourceType } from './resource'

export type TriCasterAny =
	| TriCasterMe
	| TriCasterDsk
	| TriCasterInput
	| TriCasterAudioChannel
	| TriCasterMixOutput
	| TriCasterMatrixOutput

export interface TriCasterMe extends ResourceBase {
	resourceType: ResourceType.TRICASTER_ME

	name: string
}

export interface TriCasterDsk extends ResourceBase {
	resourceType: ResourceType.TRICASTER_DSK

	name: string
}

export interface TriCasterInput extends ResourceBase {
	resourceType: ResourceType.TRICASTER_INPUT

	name: string
}

export interface TriCasterAudioChannel extends ResourceBase {
	resourceType: ResourceType.TRICASTER_AUDIO_CHANNEL

	name: string
}

export interface TriCasterMixOutput extends ResourceBase {
	resourceType: ResourceType.TRICASTER_MIX_OUTPUT

	name: string
}

export interface TriCasterMatrixOutput extends ResourceBase {
	resourceType: ResourceType.TRICASTER_MATRIX_OUTPUT

	name: string
}
