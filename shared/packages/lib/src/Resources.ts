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
		default:
			assertNever(resource)
			return GeneralResourceType.UNKNOWN
	}
}
