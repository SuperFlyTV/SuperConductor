import { ResourceBase, ResourceType } from './resource'

export type AtemAny =
	| AtemMe
	| AtemDsk
	| AtemAux
	| AtemSsrc
	| AtemSsrcProps
	| AtemMacroPlayer
	| AtemAudioChannel
	| AtemMediaPlayer
	| AtemAudioOutput

export interface AtemMe extends ResourceBase {
	resourceType: ResourceType.ATEM_ME

	/** The 0-based index of the ME */
	index: number
}

export interface AtemDsk extends ResourceBase {
	resourceType: ResourceType.ATEM_DSK

	/** The 0-based index of the DSK */
	index: number
}

export interface AtemAux extends ResourceBase {
	resourceType: ResourceType.ATEM_AUX

	/** The 0-based index of the Aux output */
	index: number
}

export interface AtemSsrc extends ResourceBase {
	resourceType: ResourceType.ATEM_SSRC

	/** The 0-based index of the SSrc */
	index: number
}

export interface AtemSsrcProps extends ResourceBase {
	resourceType: ResourceType.ATEM_SSRC_PROPS

	/** The 0-based index of the SSrc */
	index: number
}

export interface AtemMacroPlayer extends ResourceBase {
	resourceType: ResourceType.ATEM_MACRO_PLAYER
}

export interface AtemAudioChannel extends ResourceBase {
	resourceType: ResourceType.ATEM_AUDIO_CHANNEL

	/** The 1-based index of the Audio Channel */
	index: number
}

export interface AtemMediaPlayer extends ResourceBase {
	resourceType: ResourceType.ATEM_MEDIA_PLAYER

	/** The 0-based index of the Media Player */
	index: number
}

export interface AtemAudioOutput extends ResourceBase {
	resourceType: ResourceType.ATEM_AUDIO_OUTPUT

	/** The 0-based index of the Audio Output */
	index: number
}
