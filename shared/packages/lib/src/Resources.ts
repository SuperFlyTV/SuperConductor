import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever } from './lib'

enum GeneralResourceType {
	MEDIA = 'media',
	TEMPLATE = 'template',
	ME = 'me',
	DSK = 'dsk',
	AUX = 'aux',
	SSRC = 'ssrc',
	SSRC_PROPS = 'ssrcProps',
	MACRO_PLAYER = 'macroPlayer',
	AUDIO_CHANNEL = 'audioChan',
	MEDIA_PLAYER = 'mp',
	CURRENT_SCENE = 'CURRENT_SCENE',
	CURRENT_TRANSITION = 'CURRENT_TRANSITION',
	MUTE = 'MUTE',
	RECORDING = 'RECORDING',
	SCENE_ITEM_RENDER = 'SCENE_ITEM_RENDER',
	SOURCE_SETTINGS = 'SOURCE_SETTINGS',
	STREAMING = 'STREAMING',
	INPUT = 'INPUT',
	OUTPUT = 'OUTPUT',
	OVERLAY = 'OVERLAY',
	FADE_TO_BLACK = 'FADE_TO_BLACK',
	FADER = 'FADER',
	PREVIEW = 'PREVIEW',
	OSC = 'osc',
	HTTP_REQUEST = 'http_request',
	PLAY = 'play',
	TRANSPORT = 'transport',
	UNKNOWN = 'unknown',
}

export function describeResource(resource: ResourceAny) {
	switch (resource.resourceType) {
		case ResourceType.CASPARCG_MEDIA:
			return GeneralResourceType.MEDIA
		case ResourceType.CASPARCG_TEMPLATE:
			return GeneralResourceType.TEMPLATE
		case ResourceType.CASPARCG_SERVER:
			return GeneralResourceType.UNKNOWN
		case ResourceType.ATEM_ME:
			return GeneralResourceType.ME
		case ResourceType.ATEM_DSK:
			return GeneralResourceType.DSK
		case ResourceType.ATEM_AUX:
			return GeneralResourceType.AUX
		case ResourceType.ATEM_SSRC:
			return GeneralResourceType.SSRC
		case ResourceType.ATEM_SSRC_PROPS:
			return GeneralResourceType.SSRC_PROPS
		case ResourceType.ATEM_MACRO_PLAYER:
			return GeneralResourceType.MACRO_PLAYER
		case ResourceType.ATEM_AUDIO_CHANNEL:
			return GeneralResourceType.AUDIO_CHANNEL
		case ResourceType.ATEM_MEDIA_PLAYER:
			return GeneralResourceType.MEDIA_PLAYER
		case ResourceType.OBS_SCENE:
			return GeneralResourceType.CURRENT_SCENE
		case ResourceType.OBS_TRANSITION:
			return GeneralResourceType.CURRENT_TRANSITION
		case ResourceType.OBS_RECORDING:
			return GeneralResourceType.RECORDING
		case ResourceType.OBS_SOURCE_SETTINGS:
			return GeneralResourceType.SOURCE_SETTINGS
		case ResourceType.OBS_STREAMING:
			return GeneralResourceType.STREAMING
		case ResourceType.OBS_MUTE:
			return GeneralResourceType.MUTE
		case ResourceType.OBS_RENDER:
			return GeneralResourceType.SCENE_ITEM_RENDER
		case ResourceType.VMIX_INPUT:
			return GeneralResourceType.INPUT
		case ResourceType.VMIX_INPUT_SETTINGS:
			return GeneralResourceType.SOURCE_SETTINGS
		case ResourceType.VMIX_AUDIO_SETTINGS:
			return GeneralResourceType.AUDIO_CHANNEL
		case ResourceType.VMIX_OUTPUT_SETTINGS:
			return GeneralResourceType.OUTPUT
		case ResourceType.VMIX_OVERLAY_SETTINGS:
			return GeneralResourceType.OVERLAY
		case ResourceType.VMIX_RECORDING:
			return GeneralResourceType.RECORDING
		case ResourceType.VMIX_STREAMING:
			return GeneralResourceType.STREAMING
		case ResourceType.VMIX_EXTERNAL:
			return GeneralResourceType.AUX
		case ResourceType.VMIX_FADE_TO_BLACK:
			return GeneralResourceType.FADE_TO_BLACK
		case ResourceType.VMIX_FADER:
			return GeneralResourceType.FADER
		case ResourceType.VMIX_PREVIEW:
			return GeneralResourceType.PREVIEW
		case ResourceType.OSC_MESSAGE:
			return GeneralResourceType.OSC
		case ResourceType.HTTP_REQUEST:
			return GeneralResourceType.HTTP_REQUEST
		case ResourceType.HYPERDECK_PLAY:
			return GeneralResourceType.TRANSPORT
		case ResourceType.HYPERDECK_RECORD:
			return GeneralResourceType.TRANSPORT
		case ResourceType.HYPERDECK_PREVIEW:
			return GeneralResourceType.TRANSPORT
		case ResourceType.HYPERDECK_CLIP:
			return GeneralResourceType.MEDIA
		default:
			assertNever(resource)
			return GeneralResourceType.UNKNOWN
	}
}
