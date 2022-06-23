import { AtemAny } from './Atem'
import { CasparCGAny } from './CasparCG'
import { HTTPSendAny } from './HTTPSend'
import { OBSAny } from './OBS'
import { OSCAny } from './OSC'
import { VMixAny } from './VMix'

export type ResourceAny = CasparCGAny | AtemAny | OBSAny | VMixAny | OSCAny | HTTPSendAny

export interface ResourceBase {
	resourceType: ResourceType

	deviceId: string

	/** Must be globally unique. */
	id: string

	/** Required because it is used to search/filter resources in the sidebar. Does not need to be unique. */
	displayName: string

	/** When the Resource was added to the Library [unix timestamp, ms] */
	added?: number

	/** When the Resource was last modified [unix timestamp, ms] */
	modified?: number
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
	OBS_TRANSITION = 'OBS_TRANSITION',
	OBS_RECORDING = 'OBS_RECORDING',
	OBS_STREAMING = 'OBS_STREAMING',
	OBS_SOURCE_SETTINGS = 'OBS_SOURCE_SETTINGS',
	OBS_MUTE = 'OBS_MUTE',
	OBS_RENDER = 'OBS_RENDER',

	VMIX_INPUT = 'VMIX_INPUT',
	VMIX_PREVIEW = 'VMIX_PREVIEW',
	VMIX_INPUT_SETTINGS = 'VMIX_INPUT_SETTINGS',
	VMIX_AUDIO_SETTINGS = 'VMIX_AUDIO_SETTINGS',
	VMIX_OUTPUT_SETTINGS = 'VMIX_OUTPUT_SETTINGS',
	VMIX_OVERLAY_SETTINGS = 'VMIX_OVERLAY_SETTINGS',
	VMIX_RECORDING = 'VMIX_RECORDING',
	VMIX_STREAMING = 'VMIX_STREAMING',
	VMIX_EXTERNAL = 'VMIX_EXTERNAL',
	VMIX_FADE_TO_BLACK = 'VMIX_FADE_TO_BLACK',
	VMIX_FADER = 'VMIX_FADER',

	OSC_MESSAGE = 'OSC_MESSAGE',

	HTTP_REQUEST = 'HTTP_REQUEST',
}
