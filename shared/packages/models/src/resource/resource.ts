import { AtemAny } from './Atem'
import { CasparCGAny } from './CasparCG'
import { OBSAny } from './OBS'

export type ResourceAny = CasparCGAny | AtemAny | OBSAny

export interface ResourceBase {
	resourceType: ResourceType

	deviceId: string
	id: string // Must be globally unique
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

	OBS_SCENE = 'OBS_SCENE',
}
