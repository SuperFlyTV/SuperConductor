import { protectString, ResourceAny, ResourceType, ResourceId } from '@shared/models'
import { assertNever } from './lib'
import {
	TSRTimelineObj,
	TSRTimelineContent,
	Mappings,
	Mapping,
	DeviceType,
	TimelineContentTypeAtem,
	TimelineContentTypeCasparCg,
	TimelineContentTypeHTTP,
	TimelineContentTypeHyperdeck,
	TransportStatus,
	TimelineContentTypeLawo,
	TimelineContentTypeOBS,
	TimelineContentTypeOSC,
	TimelineContentTypePanasonicPtz,
	TimelineContentTypePharos,
	TimelineContentTypeSisyfos,
	TimelineContentTypeSofieChef,
	TimelineContentTypeVizMSE,
	TimelineContentTypeVMix,
	TimelineContentTypeTriCaster,
	TimelineContentCCGMedia,
	TimelineContentCCGTemplate,
	TimelineContentOBSCurrentScene,
	TimelineContentOBSCurrentTransition,
	TimelineContentVMixProgram,
	MappingAtem,
	MappingTriCaster,
} from 'timeline-state-resolver-types'

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
	AUDIO_OUTPUT = 'audioOut',
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
	TCP_REQUEST = 'tcp_request',
	UNKNOWN = 'unknown',
}

export function describeResource(resource: ResourceAny): GeneralResourceType {
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
		case ResourceType.ATEM_AUDIO_OUTPUT:
			return GeneralResourceType.AUDIO_OUTPUT
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
		case ResourceType.VMIX_SCRIPT:
			return GeneralResourceType.MACRO_PLAYER
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
		case ResourceType.TCP_REQUEST:
			return GeneralResourceType.TCP_REQUEST
		case ResourceType.TRICASTER_ME:
			return GeneralResourceType.ME
		case ResourceType.TRICASTER_DSK:
			return GeneralResourceType.DSK
		case ResourceType.TRICASTER_INPUT:
			return GeneralResourceType.INPUT
		case ResourceType.TRICASTER_AUDIO_CHANNEL:
			return GeneralResourceType.AUDIO_CHANNEL
		case ResourceType.TRICASTER_MATRIX_OUTPUT:
			return GeneralResourceType.AUX
		case ResourceType.TRICASTER_MIX_OUTPUT:
			return GeneralResourceType.AUX
		default:
			assertNever(resource)
			return GeneralResourceType.UNKNOWN
	}
}

export function getResourceTypeFromTimelineObj(obj: TSRTimelineObj<TSRTimelineContent>): ResourceType {
	switch (obj.content.deviceType) {
		case DeviceType.ABSTRACT:
			return ResourceType.INVALID

		case DeviceType.ATEM: {
			switch (obj.content.type) {
				case TimelineContentTypeAtem.AUDIOCHANNEL:
					return ResourceType.ATEM_AUDIO_CHANNEL
				case TimelineContentTypeAtem.AUX:
					return ResourceType.ATEM_AUX
				case TimelineContentTypeAtem.DSK:
					return ResourceType.ATEM_DSK
				case TimelineContentTypeAtem.MACROPLAYER:
					return ResourceType.ATEM_MACRO_PLAYER
				case TimelineContentTypeAtem.ME:
					return ResourceType.ATEM_ME
				case TimelineContentTypeAtem.MEDIAPLAYER:
					return ResourceType.ATEM_MEDIA_PLAYER
				case TimelineContentTypeAtem.SSRC:
					return ResourceType.ATEM_SSRC
				case TimelineContentTypeAtem.SSRCPROPS:
					return ResourceType.ATEM_SSRC_PROPS
				case TimelineContentTypeAtem.AUDIOROUTING:
					return ResourceType.ATEM_AUDIO_OUTPUT
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.CASPARCG: {
			switch (obj.content.type) {
				case TimelineContentTypeCasparCg.HTMLPAGE:
					return ResourceType.INVALID
				case TimelineContentTypeCasparCg.INPUT:
					return ResourceType.INVALID
				case TimelineContentTypeCasparCg.IP:
					return ResourceType.INVALID
				case TimelineContentTypeCasparCg.MEDIA:
					return ResourceType.CASPARCG_MEDIA
				case TimelineContentTypeCasparCg.RECORD:
					return ResourceType.INVALID
				case TimelineContentTypeCasparCg.ROUTE:
					return ResourceType.INVALID
				case TimelineContentTypeCasparCg.TEMPLATE:
					return ResourceType.CASPARCG_TEMPLATE
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.HTTPSEND: {
			switch (obj.content.type) {
				case TimelineContentTypeHTTP.DELETE:
				case TimelineContentTypeHTTP.GET:
				case TimelineContentTypeHTTP.POST:
				case TimelineContentTypeHTTP.PUT:
					return ResourceType.HTTP_REQUEST
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.HYPERDECK: {
			switch (obj.content.type) {
				case TimelineContentTypeHyperdeck.TRANSPORT:
					switch (obj.content.status) {
						case TransportStatus.FORWARD:
						case TransportStatus.JOG:
						case TransportStatus.REWIND:
						case TransportStatus.SHUTTLE:
						case TransportStatus.STOPPED:
							return ResourceType.INVALID
						case TransportStatus.PLAY:
							return ResourceType.HYPERDECK_PLAY
						case TransportStatus.PREVIEW:
							return ResourceType.HYPERDECK_PREVIEW
						case TransportStatus.RECORD:
							return ResourceType.HYPERDECK_RECORD
						default:
							assertNever(obj.content)
					}

					break
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.LAWO: {
			switch (obj.content.type) {
				case TimelineContentTypeLawo.EMBER_PROPERTY:
					return ResourceType.INVALID
				case TimelineContentTypeLawo.SOURCE:
					return ResourceType.INVALID
				case TimelineContentTypeLawo.SOURCES:
					return ResourceType.INVALID
				case TimelineContentTypeLawo.TRIGGER_VALUE:
					return ResourceType.INVALID
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.OBS: {
			switch (obj.content.type) {
				case TimelineContentTypeOBS.CURRENT_SCENE:
					return ResourceType.OBS_SCENE
				case TimelineContentTypeOBS.CURRENT_TRANSITION:
					return ResourceType.OBS_TRANSITION
				case TimelineContentTypeOBS.MUTE:
					return ResourceType.OBS_MUTE
				case TimelineContentTypeOBS.RECORDING:
					return ResourceType.OBS_RECORDING
				case TimelineContentTypeOBS.SCENE_ITEM_RENDER:
					return ResourceType.OBS_RENDER
				case TimelineContentTypeOBS.SOURCE_SETTINGS:
					return ResourceType.OBS_SOURCE_SETTINGS
				case TimelineContentTypeOBS.STREAMING:
					return ResourceType.OBS_STREAMING
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.OSC: {
			switch (obj.content.type) {
				case TimelineContentTypeOSC.OSC:
					return ResourceType.OSC_MESSAGE
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.PANASONIC_PTZ: {
			switch (obj.content.type) {
				case TimelineContentTypePanasonicPtz.PRESET:
				case TimelineContentTypePanasonicPtz.SPEED:
				case TimelineContentTypePanasonicPtz.ZOOM:
				case TimelineContentTypePanasonicPtz.ZOOM_SPEED:
					return ResourceType.INVALID
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.PHAROS: {
			switch (obj.content.type) {
				case TimelineContentTypePharos.SCENE:
				case TimelineContentTypePharos.TIMELINE:
					return ResourceType.INVALID
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.QUANTEL: {
			return ResourceType.INVALID
		}

		case DeviceType.SHOTOKU: {
			return ResourceType.INVALID
		}

		case DeviceType.SINGULAR_LIVE: {
			return ResourceType.INVALID
		}

		case DeviceType.SISYFOS: {
			switch (obj.content.type) {
				case TimelineContentTypeSisyfos.CHANNEL:
				case TimelineContentTypeSisyfos.CHANNELS:
				case TimelineContentTypeSisyfos.TRIGGERVALUE:
					return ResourceType.INVALID
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.SOFIE_CHEF: {
			switch (obj.content.type) {
				case TimelineContentTypeSofieChef.URL:
					return ResourceType.INVALID
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.TCPSEND: {
			return ResourceType.TCP_REQUEST
		}

		case DeviceType.TELEMETRICS: {
			return ResourceType.INVALID
		}

		case DeviceType.VIZMSE: {
			switch (obj.content.type) {
				case TimelineContentTypeVizMSE.CLEANUP_SHOWS:
				case TimelineContentTypeVizMSE.CLEAR_ALL_ELEMENTS:
				case TimelineContentTypeVizMSE.CONCEPT:
				case TimelineContentTypeVizMSE.CONTINUE:
				case TimelineContentTypeVizMSE.ELEMENT_INTERNAL:
				case TimelineContentTypeVizMSE.ELEMENT_PILOT:
				case TimelineContentTypeVizMSE.INITIALIZE_SHOWS:
				case TimelineContentTypeVizMSE.LOAD_ALL_ELEMENTS:
					return ResourceType.INVALID
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.VMIX: {
			switch (obj.content.type) {
				case TimelineContentTypeVMix.AUDIO:
					return ResourceType.VMIX_AUDIO_SETTINGS
				case TimelineContentTypeVMix.EXTERNAL:
					return ResourceType.VMIX_EXTERNAL
				case TimelineContentTypeVMix.FADER:
					return ResourceType.VMIX_FADER
				case TimelineContentTypeVMix.FADE_TO_BLACK:
					return ResourceType.VMIX_FADE_TO_BLACK
				case TimelineContentTypeVMix.INPUT:
					return ResourceType.VMIX_INPUT_SETTINGS
				case TimelineContentTypeVMix.OUTPUT:
					return ResourceType.VMIX_OUTPUT_SETTINGS
				case TimelineContentTypeVMix.OVERLAY:
					return ResourceType.VMIX_OVERLAY_SETTINGS
				case TimelineContentTypeVMix.PREVIEW:
					return ResourceType.VMIX_PREVIEW
				case TimelineContentTypeVMix.PROGRAM:
					return ResourceType.VMIX_INPUT
				case TimelineContentTypeVMix.RECORDING:
					return ResourceType.VMIX_RECORDING
				case TimelineContentTypeVMix.STREAMING:
					return ResourceType.VMIX_STREAMING
				case TimelineContentTypeVMix.SCRIPT:
					return ResourceType.VMIX_SCRIPT
				default:
					assertNever(obj.content)
			}

			break
		}

		case DeviceType.TRICASTER: {
			switch (obj.content.type) {
				case TimelineContentTypeTriCaster.ME:
					return ResourceType.TRICASTER_ME
				case TimelineContentTypeTriCaster.DSK:
					return ResourceType.TRICASTER_DSK
				case TimelineContentTypeTriCaster.INPUT:
					return ResourceType.TRICASTER_INPUT
				case TimelineContentTypeTriCaster.AUDIO_CHANNEL:
					return ResourceType.TRICASTER_AUDIO_CHANNEL
				case TimelineContentTypeTriCaster.MIX_OUTPUT:
					return ResourceType.TRICASTER_MIX_OUTPUT
				case TimelineContentTypeTriCaster.MATRIX_OUTPUT:
					return ResourceType.TRICASTER_MATRIX_OUTPUT
				default:
					assertNever(obj.content)
			}
			break
		}

		default:
			assertNever(obj.content)
	}

	return ResourceType.INVALID
}

/** Returns a string that can uniquely identify a timelineObj (within its type)  */
export function getResourceLocatorFromTimelineObj(
	obj: TSRTimelineObj<TSRTimelineContent>,
	resourceType: ResourceType,
	mappings: Mappings
): string {
	const mapping = mappings[obj.layer]
	switch (resourceType) {
		case ResourceType.ATEM_AUDIO_CHANNEL:
		case ResourceType.ATEM_AUX:
		case ResourceType.ATEM_DSK:
		case ResourceType.ATEM_MACRO_PLAYER:
		case ResourceType.ATEM_ME:
		case ResourceType.ATEM_MEDIA_PLAYER:
		case ResourceType.ATEM_SSRC:
		case ResourceType.ATEM_SSRC_PROPS:
		case ResourceType.ATEM_AUDIO_OUTPUT:
			return String((mapping as MappingAtem).index)
		case ResourceType.CASPARCG_MEDIA:
			return (obj as TSRTimelineObj<TimelineContentCCGMedia>).content.file.toUpperCase()
		case ResourceType.CASPARCG_SERVER:
			return 'UNSUPPORTED' // not yet supported
		case ResourceType.CASPARCG_TEMPLATE:
			return (obj as TSRTimelineObj<TimelineContentCCGTemplate>).content.name.toUpperCase()
		case ResourceType.HTTP_REQUEST:
			return '0'
		case ResourceType.HYPERDECK_CLIP:
		case ResourceType.HYPERDECK_PLAY:
		case ResourceType.HYPERDECK_PREVIEW:
		case ResourceType.HYPERDECK_RECORD:
			return '0'
		case ResourceType.INVALID:
			return 'INVALID'
		case ResourceType.OBS_MUTE:
		case ResourceType.OBS_RECORDING:
		case ResourceType.OBS_STREAMING:
		case ResourceType.OBS_RENDER:
		case ResourceType.OBS_SOURCE_SETTINGS:
			return '0'
		case ResourceType.OBS_SCENE:
			return (obj as TSRTimelineObj<TimelineContentOBSCurrentScene>).content.sceneName
		case ResourceType.OBS_TRANSITION:
			return (obj as TSRTimelineObj<TimelineContentOBSCurrentTransition>).content.transitionName
		case ResourceType.OSC_MESSAGE:
		case ResourceType.TCP_REQUEST:
			return '0'
		case ResourceType.VMIX_AUDIO_SETTINGS:
		case ResourceType.VMIX_EXTERNAL:
		case ResourceType.VMIX_FADER:
		case ResourceType.VMIX_FADE_TO_BLACK:
		case ResourceType.VMIX_INPUT_SETTINGS:
		case ResourceType.VMIX_OUTPUT_SETTINGS:
		case ResourceType.VMIX_OVERLAY_SETTINGS:
		case ResourceType.VMIX_PREVIEW:
		case ResourceType.VMIX_RECORDING:
		case ResourceType.VMIX_STREAMING:
		case ResourceType.VMIX_SCRIPT:
			return '0'
		case ResourceType.VMIX_INPUT: {
			// TODO: something might be wrong here? (TimelineContentVMixProgram vs TimelineContentVMixInput)
			const vmixObj = obj as TSRTimelineObj<TimelineContentVMixProgram>
			return `${vmixObj.content.input}`
		}
		case ResourceType.TRICASTER_ME:
		case ResourceType.TRICASTER_DSK:
		case ResourceType.TRICASTER_INPUT:
		case ResourceType.TRICASTER_AUDIO_CHANNEL:
		case ResourceType.TRICASTER_MIX_OUTPUT:
		case ResourceType.TRICASTER_MATRIX_OUTPUT:
			return (mapping as MappingTriCaster).name
		default:
			assertNever(resourceType)
	}

	return 'INVALID_RESOURCE_NAME'
}

export function getResourceIdFromResource(resource: ResourceAny): ResourceId {
	const locator = getResourceLocatorFromResource(resource)

	return protectString<ResourceId>(`${resource.deviceId}_${resource.resourceType}_${locator}`)
}
/** Returns a string that can uniquely identify a a resouce (within its type) */
export function getResourceLocatorFromResource(resource: ResourceAny): string {
	switch (resource.resourceType) {
		case ResourceType.ATEM_AUDIO_CHANNEL:
		case ResourceType.ATEM_AUX:
		case ResourceType.ATEM_DSK:
		case ResourceType.ATEM_ME:
		case ResourceType.ATEM_MEDIA_PLAYER:
		case ResourceType.ATEM_SSRC:
		case ResourceType.ATEM_SSRC_PROPS:
		case ResourceType.ATEM_AUDIO_OUTPUT:
			return `${resource.index}`
		case ResourceType.ATEM_MACRO_PLAYER:
			return `0`
		case ResourceType.CASPARCG_SERVER:
			return 'UNSUPPORTED' // not yet supported
		case ResourceType.CASPARCG_MEDIA:
		case ResourceType.CASPARCG_TEMPLATE:
			return resource.name.toUpperCase()
		case ResourceType.HTTP_REQUEST:
			return '0'
		case ResourceType.HYPERDECK_PLAY:
		case ResourceType.HYPERDECK_PREVIEW:
		case ResourceType.HYPERDECK_RECORD:
			return '0'
		case ResourceType.HYPERDECK_CLIP:
			return `${resource.clipId}_${resource.clipName}`
		case ResourceType.OBS_MUTE:
		case ResourceType.OBS_RECORDING:
		case ResourceType.OBS_STREAMING:
		case ResourceType.OBS_RENDER:
		case ResourceType.OBS_SOURCE_SETTINGS:
			return '0'
		case ResourceType.OBS_SCENE:
		case ResourceType.OBS_TRANSITION:
			return resource.name
		case ResourceType.OSC_MESSAGE:
		case ResourceType.TCP_REQUEST:
			return '0'
		case ResourceType.VMIX_AUDIO_SETTINGS:
		case ResourceType.VMIX_EXTERNAL:
		case ResourceType.VMIX_FADER:
		case ResourceType.VMIX_FADE_TO_BLACK:
		case ResourceType.VMIX_INPUT_SETTINGS:
		case ResourceType.VMIX_OUTPUT_SETTINGS:
		case ResourceType.VMIX_OVERLAY_SETTINGS:
		case ResourceType.VMIX_PREVIEW:
		case ResourceType.VMIX_RECORDING:
		case ResourceType.VMIX_STREAMING:
		case ResourceType.VMIX_SCRIPT:
			return '0'
		case ResourceType.VMIX_INPUT:
			// todo: something might be wrong here, type doesn't seem to be used
			return `${resource.number}`
		case ResourceType.TRICASTER_ME:
		case ResourceType.TRICASTER_DSK:
		case ResourceType.TRICASTER_INPUT:
		case ResourceType.TRICASTER_AUDIO_CHANNEL:
		case ResourceType.TRICASTER_MATRIX_OUTPUT:
		case ResourceType.TRICASTER_MIX_OUTPUT:
			return resource.name
		default: {
			assertNever(resource)
			// eslint-disable-next-line no-console
			console.error(`Unknown resourceType "${(resource as any).resourceType}"`)
			return 'INVALID'
		}
	}
}

/**
 * Returns a string that uniquely identifies the Resource which would result in a certain TimelineObj.
 */
export function getResourceIdFromTimelineObj(
	obj: TSRTimelineObj<TSRTimelineContent>,
	mappings: Mappings
): ResourceId | undefined {
	const mapping = mappings[obj.layer] as Mapping | undefined
	if (!mapping) return undefined
	const resourceType = getResourceTypeFromTimelineObj(obj)
	const locator = getResourceLocatorFromTimelineObj(obj, resourceType, mappings)

	return protectString<ResourceId>(`${mapping.deviceId}_${resourceType}_${locator}`)
}
