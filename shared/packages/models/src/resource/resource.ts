import { AtemAny } from './Atem.js'
import { CasparCGAny } from './CasparCG.js'
import { HTTPSendAny } from './HTTPSend.js'
import { HyperdeckAny } from './Hyperdeck.js'
import { OBSAny } from './OBS.js'
import { OSCAny } from './OSC.js'
import { TCPSendAny } from './TCPSend.js'
import { VMixAny } from './VMix.js'
import { ProtectedString } from '../protectedString.js'
import { TSRDeviceId } from '../tsrDevice.js'
import { TriCasterAny } from './TriCaster.js'

export type ResourceAny =
	| CasparCGAny
	| AtemAny
	| OBSAny
	| VMixAny
	| OSCAny
	| HTTPSendAny
	| HyperdeckAny
	| TCPSendAny
	| TriCasterAny

export type ResourceId = ProtectedString<'resourceId'>

export interface ResourceBase {
	resourceType: ResourceType

	deviceId: TSRDeviceId

	/** Must be globally unique. */
	id: ResourceId

	/** Required because it is used to search/filter resources in the sidebar. Does not need to be unique. */
	displayName: string

	/** When the Resource was added to the Library [unix timestamp, ms] */
	added?: number

	/** When the Resource was last modified [unix timestamp, ms] */
	modified?: number

	additionalInfo?: { label: string; value: string }[]

	/** User facing message, explaining something is wrong with the resource */
	errorMessage?: string
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
	ATEM_AUDIO_OUTPUT = 'ATEM_AUDIO_OUTPUT',

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
	VMIX_SCRIPT = 'VMIX_SCRIPT',

	OSC_MESSAGE = 'OSC_MESSAGE',

	HTTP_REQUEST = 'HTTP_REQUEST',

	HYPERDECK_PLAY = 'HYPERDECK_PLAY',
	HYPERDECK_RECORD = 'HYPERDECK_RECORD',
	HYPERDECK_PREVIEW = 'HYPERDECK_PREVIEW',
	HYPERDECK_CLIP = 'HYPERDECK_CLIP',

	TCP_REQUEST = 'TCP_REQUEST',

	TRICASTER_ME = 'TRICASTER_ME',
	TRICASTER_DSK = 'TRICASTER_DSK',
	TRICASTER_INPUT = 'TRICASTER_INPUT',
	TRICASTER_AUDIO_CHANNEL = 'TRICASTER_AUDIO_CHANNEL',
	TRICASTER_MIX_OUTPUT = 'TRICASTER_MIX_OUTPUT',
	TRICASTER_MATRIX_OUTPUT = 'TRICASTER_MATRIX_OUTPUT',

	INVALID = 'INVALID',
}
