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
		default:
			assertNever(resource)
			return GeneralResourceType.UNKNOWN
	}
}
