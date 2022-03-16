import { AtemAny } from './Atem'
import { CasparCGAny } from './CasparCG'

export type ResourceAny = CasparCGAny | AtemAny

export interface ResourceBase {
	resourceType: ResourceType

	deviceId: string
	id: string // unique within that deviceId
}
export enum ResourceType {
	CASPARCG_SERVER = 'CASPARCG_SERVER',

	CASPARCG_MEDIA = 'CASPARCG_MEDIA',
	CASPARCG_TEMPLATE = 'CASPARCG_TEMPLATE',

	ATEM_ME = 'ATEM_ME',
	ATEM_DSK = 'ATEM_DSK',
	ATEM_AUX = 'ATEM_AUX',
	ATEM_SSRC = 'ATEM_SSRC',
	ATEM_SSRC_PROPS = 'ATEM_SSRC_PROPS',
	ATEM_MACRO_PLAYER = 'ATEM_MACRO_PLAYER',
	ATEM_AUDIO_CHANNEL = 'ATEM_AUDIO_CHANNEL',
	ATEM_MEDIA_PLAYER = 'ATEM_MEDIA_PLAYER',
}
