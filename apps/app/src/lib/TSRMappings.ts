import { assertNever, literal } from '@shared/lib'
import { ResourceAny, ResourceType } from '@shared/models'
import { GDDSchema } from 'graphics-data-definition'
import {
	DeviceType,
	Mapping,
	MappingAbstract,
	MappingAtem,
	MappingAtemType,
	MappingCasparCG,
	MappingHTTPSend,
	MappingHTTPWatcher,
	MappingHyperdeck,
	MappingHyperdeckType,
	MappingLawo,
	MappingLawoType,
	MappingOBS,
	MappingOBSAny,
	MappingOBSSourceSettings,
	MappingOBSType,
	MappingOSC,
	MappingPanasonicPtz,
	MappingPanasonicPtzType,
	MappingPharos,
	MappingQuantel,
	Mappings,
	MappingShotoku,
	MappingSingularLive,
	MappingSisyfos,
	MappingSisyfosType,
	MappingSofieChef,
	MappingTCPSend,
	MappingVizMSE,
	MappingVMix,
	MappingVMixAny,
	MappingVMixProgram,
	MappingVMixType,
	TimelineContentTypeAtem,
	TimelineContentTypeHyperdeck,
	TimelineContentTypeLawo,
	TimelineContentTypeOBS,
	TimelineContentTypePanasonicPtz,
	TimelineContentTypeSisyfos,
	TimelineContentTypeVMix,
	TSRTimelineObj,
} from 'timeline-state-resolver-types'
import { Project } from '../models/project/Project'
import { listAvailableDeviceIDs } from './util'
import { TimelineObj } from '../models/rundown/TimelineObj'

/** Returns true if the given mapping - TSRTimelineObject-combination is valid */
export function filterMapping(mapping: Mapping, obj: TSRTimelineObj): boolean {
	if (mapping.device !== obj.content.deviceType) return false

	if (obj.content.deviceType === DeviceType.ABSTRACT) {
		// MappingAbstract
		return true
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		const atemMapping = mapping as MappingAtem

		switch (obj.content.type) {
			case TimelineContentTypeAtem.ME:
				return atemMapping.mappingType === MappingAtemType.MixEffect
			case TimelineContentTypeAtem.DSK:
				return atemMapping.mappingType === MappingAtemType.DownStreamKeyer
			case TimelineContentTypeAtem.SSRC:
				return atemMapping.mappingType === MappingAtemType.SuperSourceBox
			case TimelineContentTypeAtem.AUX:
				return atemMapping.mappingType === MappingAtemType.Auxilliary
			case TimelineContentTypeAtem.MEDIAPLAYER:
				return atemMapping.mappingType === MappingAtemType.MediaPlayer
			case TimelineContentTypeAtem.SSRCPROPS:
				return atemMapping.mappingType === MappingAtemType.SuperSourceProperties
			case TimelineContentTypeAtem.AUDIOCHANNEL:
				return atemMapping.mappingType === MappingAtemType.AudioChannel
			case TimelineContentTypeAtem.MACROPLAYER:
				return atemMapping.mappingType === MappingAtemType.MacroPlayer
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.CASPARCG) {
		// MappingCasparCG
		return true
	} else if (obj.content.deviceType === DeviceType.HTTPSEND) {
		// MappingHTTPSend
		return true
	} else if (obj.content.deviceType === DeviceType.TCPSEND) {
		// MappingTCPSend
		return true
	} else if (obj.content.deviceType === DeviceType.HYPERDECK) {
		const hyperdeckMapping = mapping as MappingHyperdeck

		switch (obj.content.type) {
			case TimelineContentTypeHyperdeck.TRANSPORT:
				return hyperdeckMapping.mappingType === MappingHyperdeckType.TRANSPORT
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.LAWO) {
		const lawoMapping = mapping as MappingLawo

		switch (obj.content.type) {
			case TimelineContentTypeLawo.SOURCE:
				return lawoMapping.mappingType === MappingLawoType.SOURCE
			case TimelineContentTypeLawo.SOURCES:
				return true
			case TimelineContentTypeLawo.EMBER_PROPERTY:
				return true
			case TimelineContentTypeLawo.TRIGGER_VALUE:
				return true
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.OBS) {
		const obsMapping = mapping as MappingOBS

		switch (obj.content.type) {
			case TimelineContentTypeOBS.CURRENT_TRANSITION:
				return obsMapping.mappingType === MappingOBSType.CurrentTransition
			case TimelineContentTypeOBS.CURRENT_SCENE:
				return obsMapping.mappingType === MappingOBSType.CurrentScene
			case TimelineContentTypeOBS.RECORDING:
				return obsMapping.mappingType === MappingOBSType.Recording
			case TimelineContentTypeOBS.STREAMING:
				return obsMapping.mappingType === MappingOBSType.Streaming
			case TimelineContentTypeOBS.SCENE_ITEM_RENDER:
				return obsMapping.mappingType === MappingOBSType.SceneItemRender
			case TimelineContentTypeOBS.MUTE:
				return obsMapping.mappingType === MappingOBSType.Mute
			case TimelineContentTypeOBS.SOURCE_SETTINGS:
				return obsMapping.mappingType === MappingOBSType.SourceSettings
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.OSC) {
		// MappingOSC
		return true
	} else if (obj.content.deviceType === DeviceType.PHAROS) {
		// MappingPharos
		return true
	} else if (obj.content.deviceType === DeviceType.PANASONIC_PTZ) {
		const panasonicPtzMapping = mapping as MappingPanasonicPtz

		switch (obj.content.type) {
			case TimelineContentTypePanasonicPtz.SPEED:
				return panasonicPtzMapping.mappingType === MappingPanasonicPtzType.PRESET_SPEED
			case TimelineContentTypePanasonicPtz.PRESET:
				return panasonicPtzMapping.mappingType === MappingPanasonicPtzType.PRESET
			case TimelineContentTypePanasonicPtz.ZOOM:
				return panasonicPtzMapping.mappingType === MappingPanasonicPtzType.ZOOM
			case TimelineContentTypePanasonicPtz.ZOOM_SPEED:
				return panasonicPtzMapping.mappingType === MappingPanasonicPtzType.ZOOM_SPEED
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.QUANTEL) {
		// MappingQuantel
		return true
	} else if (obj.content.deviceType === DeviceType.SHOTOKU) {
		// MappingShotoku
		return true
	} else if (obj.content.deviceType === DeviceType.SISYFOS) {
		const sisyfosMapping = mapping as MappingSisyfos

		switch (obj.content.type) {
			case TimelineContentTypeSisyfos.CHANNEL:
				return (
					sisyfosMapping.mappingType === MappingSisyfosType.CHANNEL ||
					sisyfosMapping.mappingType === MappingSisyfosType.CHANNEL_BY_LABEL
				)
			case TimelineContentTypeSisyfos.CHANNELS:
				return sisyfosMapping.mappingType === MappingSisyfosType.CHANNELS
			case TimelineContentTypeSisyfos.TRIGGERVALUE:
				return true
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.SINGULAR_LIVE) {
		// MappingSingularLive
		return true
	} else if (obj.content.deviceType === DeviceType.VMIX) {
		const vmixMapping = mapping as MappingVMix

		switch (obj.content.type) {
			case TimelineContentTypeVMix.PROGRAM:
				return vmixMapping.mappingType === MappingVMixType.Program
			case TimelineContentTypeVMix.PREVIEW:
				return vmixMapping.mappingType === MappingVMixType.Preview
			case TimelineContentTypeVMix.INPUT:
				return vmixMapping.mappingType === MappingVMixType.Input
			case TimelineContentTypeVMix.AUDIO:
				return vmixMapping.mappingType === MappingVMixType.AudioChannel
			case TimelineContentTypeVMix.OUTPUT:
				return vmixMapping.mappingType === MappingVMixType.Output
			case TimelineContentTypeVMix.OVERLAY:
				return vmixMapping.mappingType === MappingVMixType.Overlay
			case TimelineContentTypeVMix.RECORDING:
				return vmixMapping.mappingType === MappingVMixType.Recording
			case TimelineContentTypeVMix.STREAMING:
				return vmixMapping.mappingType === MappingVMixType.Streaming
			case TimelineContentTypeVMix.EXTERNAL:
				return vmixMapping.mappingType === MappingVMixType.External
			case TimelineContentTypeVMix.FADE_TO_BLACK:
				return vmixMapping.mappingType === MappingVMixType.FadeToBlack
			case TimelineContentTypeVMix.FADER:
				return vmixMapping.mappingType === MappingVMixType.Fader
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.VIZMSE) {
		// MappingVizMSE
		return true
	} else if (obj.content.deviceType === DeviceType.SOFIE_CHEF) {
		// MappingSofieChef
		return true
	} else if (obj.content.deviceType === DeviceType.TELEMETRICS) {
		return true
	} else {
		assertNever(obj.content)
		return false
	}
}

/** Tries to guess which device a timelineObject is likely to be using */
export function guessDeviceIdFromTimelineObject(project: Project, obj: TSRTimelineObj): string | undefined {
	const allDeviceIds = listAvailableDeviceIDs(project.bridges)
	const sortedMappings = sortMappings(project.mappings)

	for (const { mapping } of sortedMappings) {
		// Does the layer have a device?
		if (!allDeviceIds.has(mapping.deviceId)) continue
		// Is the layer compatible?
		if (!filterMapping(mapping, obj)) continue

		return mapping.deviceId
	}
	return undefined
}
export function getMappingFromTimelineObject(
	obj: TSRTimelineObj,
	deviceId: string,
	resource: ResourceAny | undefined
): Mapping | undefined {
	if (obj.content.deviceType === DeviceType.ABSTRACT) {
		return literal<MappingAbstract>({
			device: DeviceType.ABSTRACT,
			deviceId: deviceId,
			layerName: 'Abstract',
		})
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		// MappingAtem

		switch (obj.content.type) {
			case TimelineContentTypeAtem.ME: {
				const index = resource?.resourceType === ResourceType.ATEM_ME ? resource.index : 0
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem ME ${index + 1}`,
					mappingType: MappingAtemType.MixEffect,
					index,
				})
			}

			case TimelineContentTypeAtem.DSK: {
				const index = resource?.resourceType === ResourceType.ATEM_DSK ? resource.index : 0
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem DSK ${index + 1}`,
					mappingType: MappingAtemType.DownStreamKeyer,
					index,
				})
			}

			case TimelineContentTypeAtem.SSRC: {
				const index = resource?.resourceType === ResourceType.ATEM_SSRC ? resource.index : 0
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem SS ${index + 1}`,
					mappingType: MappingAtemType.SuperSourceBox,
					index,
				})
			}

			case TimelineContentTypeAtem.AUX: {
				const index = resource?.resourceType === ResourceType.ATEM_AUX ? resource.index : 0
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem AUX ${index + 1}`,
					mappingType: MappingAtemType.Auxilliary,
					index,
				})
			}

			case TimelineContentTypeAtem.MEDIAPLAYER: {
				const index = resource?.resourceType === ResourceType.ATEM_MEDIA_PLAYER ? resource.index : 0
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem MP ${index + 1}`,
					mappingType: MappingAtemType.MediaPlayer,
					index,
				})
			}

			case TimelineContentTypeAtem.SSRCPROPS: {
				const index = resource?.resourceType === ResourceType.ATEM_SSRC_PROPS ? resource.index : 0
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem SS ${index + 1} props`,
					mappingType: MappingAtemType.SuperSourceProperties,
					index,
				})
			}

			case TimelineContentTypeAtem.AUDIOCHANNEL: {
				const index = resource?.resourceType === ResourceType.ATEM_AUDIO_CHANNEL ? resource.index : 0

				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: `Atem Audio ${index + 1}`,
					mappingType: MappingAtemType.AudioChannel,
					index,
				})
			}

			case TimelineContentTypeAtem.MACROPLAYER:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem Macro 1',
					mappingType: MappingAtemType.MacroPlayer,
					index: 0,
				})

			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.CASPARCG) {
		// MappingCasparCG

		let channel: number | undefined = undefined
		{
			if (resource?.resourceType === ResourceType.CASPARCG_TEMPLATE && resource.gdd) {
				const gdd: GDDSchema = resource.gdd
				const gddChannel = gdd.gddPlayoutOptions?.playout?.casparcg?.channel
				if (gddChannel !== undefined) channel = gddChannel
			}
			if (
				(resource?.resourceType === ResourceType.CASPARCG_MEDIA ||
					resource?.resourceType === ResourceType.CASPARCG_TEMPLATE) &&
				resource.channel
			)
				channel = resource.channel

			if (!channel) channel = 1 // Default
		}

		let layer: number | undefined = undefined
		{
			if (resource?.resourceType === ResourceType.CASPARCG_TEMPLATE && resource.gdd) {
				const gdd: GDDSchema = resource.gdd
				const gddLayer = gdd.gddPlayoutOptions?.playout?.casparcg?.layer
				if (gddLayer !== undefined) layer = gddLayer
			}

			if (
				(resource?.resourceType === ResourceType.CASPARCG_MEDIA ||
					resource?.resourceType === ResourceType.CASPARCG_TEMPLATE) &&
				resource.layer
			)
				layer = resource.layer

			if (!layer) layer = 1 // Default
		}
		return literal<MappingCasparCG>({
			device: DeviceType.CASPARCG,
			deviceId: deviceId,
			layerName: `CasparCG ${channel}-${layer}`,
			channel: channel,
			layer: layer,
		})
	} else if (obj.content.deviceType === DeviceType.HTTPSEND) {
		// MappingHTTPSend
		return literal<MappingHTTPSend>({
			device: DeviceType.HTTPSEND,
			deviceId: deviceId,
			layerName: 'HTTP Send',
		})
	} else if (obj.content.deviceType === DeviceType.TCPSEND) {
		// MappingTCPSend
		return literal<MappingTCPSend>({
			device: DeviceType.TCPSEND,
			deviceId: deviceId,
			layerName: 'TCP Send',
		})
	} else if (obj.content.deviceType === DeviceType.HYPERDECK) {
		// MappingHyperdeck

		switch (obj.content.type) {
			case TimelineContentTypeHyperdeck.TRANSPORT:
				return literal<MappingHyperdeck>({
					device: DeviceType.HYPERDECK,
					deviceId: deviceId,
					layerName: 'HyperDeck 1',
					mappingType: MappingHyperdeckType.TRANSPORT,
					index: 0,
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.LAWO) {
		// MappingLawo

		switch (obj.content.type) {
			case TimelineContentTypeLawo.SOURCE:
			case TimelineContentTypeLawo.SOURCES:
				return literal<MappingLawo>({
					device: DeviceType.LAWO,
					deviceId: deviceId,
					layerName: 'Lawo source',
					mappingType: MappingLawoType.SOURCE,
				})
			case TimelineContentTypeLawo.EMBER_PROPERTY:
				return literal<MappingLawo>({
					device: DeviceType.LAWO,
					deviceId: deviceId,
					layerName: 'Lawo property',
					mappingType: MappingLawoType.FULL_PATH,
				})
			case TimelineContentTypeLawo.TRIGGER_VALUE:
				return literal<MappingLawo>({
					device: DeviceType.LAWO,
					deviceId: deviceId,
					layerName: 'Lawo Trigger',
					mappingType: MappingLawoType.TRIGGER_VALUE,
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.OBS) {
		// MappingOBS

		switch (obj.content.type) {
			case TimelineContentTypeOBS.CURRENT_TRANSITION:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Transition',
					mappingType: MappingOBSType.CurrentTransition,
				})
			case TimelineContentTypeOBS.CURRENT_SCENE:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Scene',
					mappingType: MappingOBSType.CurrentScene,
				})
			case TimelineContentTypeOBS.RECORDING:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Record',
					mappingType: MappingOBSType.Recording,
				})
			case TimelineContentTypeOBS.STREAMING:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Streaming',
					mappingType: MappingOBSType.Streaming,
				})
			case TimelineContentTypeOBS.SCENE_ITEM_RENDER:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Item render',
					mappingType: MappingOBSType.SceneItemRender,
				})
			case TimelineContentTypeOBS.MUTE:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Mute',
					mappingType: MappingOBSType.Mute,
				})
			case TimelineContentTypeOBS.SOURCE_SETTINGS:
				return literal<MappingOBS>({
					device: DeviceType.OBS,
					deviceId: deviceId,
					layerName: 'OBS Source settings',
					mappingType: MappingOBSType.SourceSettings,
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.OSC) {
		// MappingOSC
		return literal<MappingOSC>({
			device: DeviceType.OSC,
			deviceId: deviceId,
			layerName: 'OSC',
		})
	} else if (obj.content.deviceType === DeviceType.PHAROS) {
		// MappingPharos
		return literal<MappingPharos>({
			device: DeviceType.PHAROS,
			deviceId: deviceId,
			layerName: 'Pharos',
		})
	} else if (obj.content.deviceType === DeviceType.PANASONIC_PTZ) {
		// MappingPanasonicPtz

		switch (obj.content.type) {
			case TimelineContentTypePanasonicPtz.SPEED:
				return literal<MappingPanasonicPtz>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceId,
					layerName: 'PTZ Speed',
					mappingType: MappingPanasonicPtzType.PRESET_SPEED,
				})
			case TimelineContentTypePanasonicPtz.PRESET:
				return literal<MappingPanasonicPtz>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceId,
					layerName: 'PTZ Preset',
					mappingType: MappingPanasonicPtzType.PRESET,
				})
			case TimelineContentTypePanasonicPtz.ZOOM:
				return literal<MappingPanasonicPtz>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceId,
					layerName: 'PTZ Zoom',
					mappingType: MappingPanasonicPtzType.ZOOM,
				})
			case TimelineContentTypePanasonicPtz.ZOOM_SPEED:
				return literal<MappingPanasonicPtz>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceId,
					layerName: 'PTZ Zoom Speed',
					mappingType: MappingPanasonicPtzType.ZOOM_SPEED,
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.QUANTEL) {
		// MappingQuantel
		return literal<MappingQuantel>({
			device: DeviceType.QUANTEL,
			deviceId: deviceId,
			layerName: 'Quantel 1',
			channelId: 1,
			portId: 'port-id',
		})
	} else if (obj.content.deviceType === DeviceType.SHOTOKU) {
		// MappingShotoku
		return literal<MappingShotoku>({
			device: DeviceType.SHOTOKU,
			deviceId: deviceId,
			layerName: 'Shotoku',
		})
	} else if (obj.content.deviceType === DeviceType.SISYFOS) {
		// MappingSisyfos

		switch (obj.content.type) {
			case TimelineContentTypeSisyfos.CHANNEL:
			case TimelineContentTypeSisyfos.TRIGGERVALUE:
				return literal<MappingSisyfos>({
					device: DeviceType.SISYFOS,
					deviceId: deviceId,
					layerName: 'Channel 1',
					mappingType: MappingSisyfosType.CHANNEL,
					channel: 0,
					setLabelToLayerName: true,
				})
			case TimelineContentTypeSisyfos.CHANNELS:
				return literal<MappingSisyfos>({
					device: DeviceType.SISYFOS,
					deviceId: deviceId,
					layerName: 'Channels',
					mappingType: MappingSisyfosType.CHANNELS,
				})

			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.SINGULAR_LIVE) {
		// MappingSingularLive
		return literal<MappingSingularLive>({
			device: DeviceType.SINGULAR_LIVE,
			deviceId: deviceId,
			layerName: 'Singular Live',
			compositionName: 'composition-name',
		})
	} else if (obj.content.deviceType === DeviceType.VMIX) {
		// MappingVMix

		switch (obj.content.type) {
			case TimelineContentTypeVMix.PROGRAM:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Program',
					mappingType: MappingVMixType.Program,
					index: 1,
				})
			case TimelineContentTypeVMix.PREVIEW:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Preview',
					mappingType: MappingVMixType.Preview,
					index: 1,
				})
			case TimelineContentTypeVMix.INPUT: {
				const index = resource?.resourceType === ResourceType.VMIX_INPUT ? resource.number : 1
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Input',
					mappingType: MappingVMixType.Input,
					index,
				})
			}
			case TimelineContentTypeVMix.AUDIO:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'AudioChannel',
					mappingType: MappingVMixType.AudioChannel,
					index: 1,
				})
			case TimelineContentTypeVMix.OUTPUT:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Output',
					mappingType: MappingVMixType.Output,
					index: '2',
				})
			case TimelineContentTypeVMix.OVERLAY:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Overlay',
					mappingType: MappingVMixType.Overlay,
					index: 1,
				})
			case TimelineContentTypeVMix.RECORDING:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Recording',
					mappingType: MappingVMixType.Recording,
				})
			case TimelineContentTypeVMix.STREAMING:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Streaming',
					mappingType: MappingVMixType.Streaming,
				})
			case TimelineContentTypeVMix.EXTERNAL:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'External',
					mappingType: MappingVMixType.External,
				})
			case TimelineContentTypeVMix.FADE_TO_BLACK:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'FadeToBlack',
					mappingType: MappingVMixType.FadeToBlack,
				})
			case TimelineContentTypeVMix.FADER:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Fader',
					mappingType: MappingVMixType.Fader,
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.VIZMSE) {
		// MappingVizMSE
		return literal<MappingVizMSE>({
			device: DeviceType.VIZMSE,
			deviceId: deviceId,
			layerName: 'VizMSE',
		})
	} else if (obj.content.deviceType === DeviceType.SOFIE_CHEF) {
		return literal<MappingSofieChef>({
			device: DeviceType.SOFIE_CHEF,
			deviceId: deviceId,
			layerName: 'Chef window',
			windowId: 'default',
		})
	} else if (obj.content.deviceType === DeviceType.TELEMETRICS) {
		return literal<Mapping>({
			device: DeviceType.TELEMETRICS,
			deviceId: deviceId,
			layerName: 'Telemetrics',
		})
	} else {
		assertNever(obj.content)
	}
}

export function getDefaultDeviceName(deviceType: DeviceType): string {
	switch (deviceType) {
		case DeviceType.ABSTRACT:
			return 'Abstract'
		case DeviceType.CASPARCG:
			return 'CasparCG'
		case DeviceType.ATEM:
			return 'ATEM'
		case DeviceType.LAWO:
			return 'Lawo'
		case DeviceType.HTTPSEND:
			return 'HTTP Send'
		case DeviceType.PANASONIC_PTZ:
			return 'Panasonic PTZ'
		case DeviceType.TCPSEND:
			return 'TCP Send'
		case DeviceType.HYPERDECK:
			return 'HyperDeck'
		case DeviceType.PHAROS:
			return 'Pharos'
		case DeviceType.OSC:
			return 'OSC'
		case DeviceType.HTTPWATCHER:
			return 'HTTP Watcher'
		case DeviceType.SISYFOS:
			return 'Sisyfos'
		case DeviceType.QUANTEL:
			return 'Quantel'
		case DeviceType.VIZMSE:
			return 'Viz MSE'
		case DeviceType.SINGULAR_LIVE:
			return 'Singular Live'
		case DeviceType.SHOTOKU:
			return 'Shotoku'
		case DeviceType.VMIX:
			return 'VMix'
		case DeviceType.OBS:
			return 'OBS'
		case DeviceType.SOFIE_CHEF:
			return 'Sofie Chef'
		case DeviceType.TELEMETRICS:
			return 'Telemetrics'
		default:
			assertNever(deviceType)
	}

	return 'Unknown'
}

/** Returns a short textual description of the Mapping */
export function describeMappingConfiguration(mapping: Mapping): string {
	switch (mapping.device) {
		case DeviceType.ABSTRACT:
			return ''
		case DeviceType.CASPARCG: {
			const typedMapping = mapping as MappingCasparCG
			return `Channel: ${typedMapping.channel}, Layer: ${typedMapping.layer}`
		}
		case DeviceType.ATEM: {
			const typedMapping = mapping as MappingAtem
			switch (typedMapping.mappingType) {
				case MappingAtemType.MixEffect:
					return `ME: ${typedMapping.index}`
				case MappingAtemType.DownStreamKeyer:
					return `DSK: ${typedMapping.index}`
				case MappingAtemType.SuperSourceBox:
					return `SSrc Box: ${typedMapping.index}`
				case MappingAtemType.Auxilliary:
					return `Aux: ${typedMapping.index}`
				case MappingAtemType.MediaPlayer:
					return `Media Player: ${typedMapping.index}`
				case MappingAtemType.SuperSourceProperties:
					return `SSrc Props: ${typedMapping.index}`
				case MappingAtemType.AudioChannel:
					return `Audio Channel: ${typedMapping.index}`
				case MappingAtemType.MacroPlayer:
					return `Macro Player: ${typedMapping.index}`
				default:
					assertNever(typedMapping.mappingType)
					return ''
			}
		}
		case DeviceType.LAWO:
			return ''
		case DeviceType.HTTPSEND:
			return ''
		case DeviceType.PANASONIC_PTZ:
			return ''
		case DeviceType.TCPSEND:
			return ''
		case DeviceType.HYPERDECK:
			return ''
		case DeviceType.PHAROS:
			return ''
		case DeviceType.OSC:
			return ''
		case DeviceType.HTTPWATCHER:
			return ''
		case DeviceType.SISYFOS:
			return ''
		case DeviceType.QUANTEL:
			return ''
		case DeviceType.VIZMSE:
			return ''
		case DeviceType.SINGULAR_LIVE:
			return ''
		case DeviceType.SHOTOKU:
			return ''
		case DeviceType.VMIX: {
			const typedMapping = mapping as MappingVMixAny
			switch (typedMapping.mappingType) {
				case MappingVMixType.AudioChannel:
					return `Index: ${typedMapping.index}, Input Layer: ${typedMapping.inputLayer}`
				case MappingVMixType.External:
					return ''
				case MappingVMixType.FadeToBlack:
					return ''
				case MappingVMixType.Fader:
					return ''
				case MappingVMixType.Input:
					return `Index: ${typedMapping.index}`
				case MappingVMixType.Output:
					return `Index: ${typedMapping.index}`
				case MappingVMixType.Overlay:
					return `Index: ${typedMapping.index}`
				case MappingVMixType.Preview:
					return `Index: ${typedMapping.index}`
				case MappingVMixType.Program:
					return `Index: ${typedMapping.index}`
				case MappingVMixType.Recording:
					return ''
				case MappingVMixType.Streaming:
					return ''
				default:
					assertNever(typedMapping)
					return ''
			}
		}
		case DeviceType.OBS: {
			// This is here to fix a typing bug in TSR. MappingOBSSourceSettings is not part of the MappingOBSAny type.
			// See https://github.com/nrkno/sofie-timeline-state-resolver/pull/208 for more details.
			const mapping0 = mapping as MappingOBS
			if (mapping0.mappingType === MappingOBSType.SourceSettings) {
				const mapping1 = mapping0 as MappingOBSSourceSettings
				return `Source: ${mapping1.source}`
			}

			const typedMapping = mapping as MappingOBSAny
			switch (typedMapping.mappingType) {
				case MappingOBSType.CurrentScene:
					return ''
				case MappingOBSType.CurrentTransition:
					return ''
				case MappingOBSType.Mute:
					return `Source: "${typedMapping.source}"`
				case MappingOBSType.Recording:
					return ''
				case MappingOBSType.SceneItemRender:
					return `Scene: "${typedMapping.sceneName}", Source: "${typedMapping.source}"`
				case MappingOBSType.Streaming: {
					return ''
				}
				default:
					// assertNever(typedMapping.mappingType)
					return ''
			}
		}
		case DeviceType.SOFIE_CHEF: {
			const typedMapping = mapping as MappingSofieChef
			return `Window ${typedMapping.windowId}`
		}
		case DeviceType.TELEMETRICS: {
			return ''
		}
		default:
			assertNever(mapping.device)
			return ''
	}
}

export function getDefaultMappingForDeviceType(
	deviceType: DeviceType,
	deviceId: string,
	allMappings: Mappings
): Mapping {
	// Filter mapping for deviceId:
	const mappings: Mappings = {}
	for (const [id, mapping] of Object.entries(allMappings)) {
		if (mapping.deviceId === deviceId) mappings[id] = mapping
	}

	if (deviceType === DeviceType.ABSTRACT) {
		const m = literal<MappingAbstract>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.CASPARCG) {
		const channel = getLastBiggestValue(mappings, (m) => m.device === deviceType && m.channel) ?? 1
		const layer = (getLastBiggestValue(mappings, (m) => m.device === deviceType && m.layer) ?? 0) + 10

		const m = literal<MappingCasparCG>({
			channel,
			layer,
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.ATEM) {
		const index = (getLastBiggestValue(mappings, (m) => m.device === deviceType && m.index) ?? 0) + 1
		const m = literal<MappingAtem>({
			index,
			device: deviceType,
			deviceId,
			mappingType: MappingAtemType.MixEffect,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.LAWO) {
		const m = literal<MappingLawo>({
			device: deviceType,
			deviceId,
			mappingType: MappingLawoType.SOURCE,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.HTTPSEND) {
		const m = literal<MappingHTTPSend>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.PANASONIC_PTZ) {
		const m = literal<MappingPanasonicPtz>({
			device: DeviceType.PANASONIC_PTZ,
			deviceId: deviceId,
			layerName: '', // Set later
			mappingType: MappingPanasonicPtzType.PRESET,
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.TCPSEND) {
		const m = literal<MappingTCPSend>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.HYPERDECK) {
		const index = (getLastBiggestValue(mappings, (m) => m.device === deviceType && m.index) ?? -1) + 1
		const m = literal<MappingHyperdeck>({
			device: deviceType,
			deviceId,
			mappingType: MappingHyperdeckType.TRANSPORT,
			index,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.PHAROS) {
		const m = literal<MappingPharos>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.OSC) {
		const m = literal<MappingOSC>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.HTTPWATCHER) {
		const m = literal<MappingHTTPWatcher>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SISYFOS) {
		const channel =
			(getLastBiggestValue(
				mappings,
				(m) => m.device === deviceType && m.mappingType === MappingSisyfosType.CHANNEL && m.channel
			) ?? -1) + 1
		const m = literal<MappingSisyfos>({
			device: deviceType,
			deviceId: deviceId,
			mappingType: MappingSisyfosType.CHANNEL,
			channel,
			layerName: '', // Set later
			setLabelToLayerName: true,
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.QUANTEL) {
		const channelId = (getLastBiggestValue(mappings, (m) => m.device === deviceType && m.channelId) ?? 0) + 1

		const m = literal<MappingQuantel>({
			device: deviceType,
			deviceId: deviceId,
			channelId,
			layerName: '', // Set later
			portId: 'port-id',
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.VIZMSE) {
		const m = literal<MappingVizMSE>({
			device: deviceType,
			deviceId: deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SINGULAR_LIVE) {
		const m = literal<MappingSingularLive>({
			device: deviceType,
			deviceId: deviceId,
			layerName: '', // Set later
			compositionName: 'composition-name',
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SHOTOKU) {
		const m = literal<MappingShotoku>({
			device: deviceType,
			deviceId: deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.VMIX) {
		const m = literal<MappingVMixProgram>({
			index: 1,
			device: deviceType,
			deviceId,
			mappingType: MappingVMixType.Program,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.OBS) {
		const m = literal<MappingOBS>({
			device: deviceType,
			deviceId,
			mappingType: MappingOBSType.CurrentScene,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SOFIE_CHEF) {
		const m = literal<MappingSofieChef>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
			windowId: 'default',
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.TELEMETRICS) {
		const m = literal<Mapping>({
			device: deviceType,
			deviceId,
			layerName: '', // Set later
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else {
		assertNever(deviceType)
		const m = literal<Mapping>({
			device: deviceType,
			deviceId: deviceId,
		})
		m.layerName = getDefaultLayerName(m)
		return m
	}
}
export function getDefaultLayerName(mapping: Mapping): string {
	if (mapping.device === DeviceType.ABSTRACT) {
		return `Abstract`
	} else if (mapping.device === DeviceType.CASPARCG) {
		const m = mapping as MappingCasparCG
		return `CasparCG ${m.channel}-${m.layer}`
	} else if (mapping.device === DeviceType.ATEM) {
		const m = mapping as MappingAtem
		return `Atem ME ${m.index}`
	} else if (mapping.device === DeviceType.LAWO) {
		return `Lawo source`
	} else if (mapping.device === DeviceType.HTTPSEND) {
		return `HTTP Send`
	} else if (mapping.device === DeviceType.PANASONIC_PTZ) {
		return 'PTZ Preset'
	} else if (mapping.device === DeviceType.TCPSEND) {
		return `TCP Send`
	} else if (mapping.device === DeviceType.HYPERDECK) {
		const m = mapping as MappingHyperdeck
		if (m.mappingType === MappingHyperdeckType.TRANSPORT) {
			return `HyperDeck ${(m.index ?? 0) + 1}`
		} else {
			assertNever(m.mappingType)
			return `HyperDeck`
		}
	} else if (mapping.device === DeviceType.PHAROS) {
		return `Pharos`
	} else if (mapping.device === DeviceType.OSC) {
		return `OSC`
	} else if (mapping.device === DeviceType.HTTPWATCHER) {
		return `HTTP watcher`
	} else if (mapping.device === DeviceType.SISYFOS) {
		const m = mapping as MappingSisyfos
		if (m.mappingType === MappingSisyfosType.CHANNEL) {
			return `Channel ${m.channel + 1}`
		} else if (m.mappingType === MappingSisyfosType.CHANNELS) {
			return `Channels`
		} else if (m.mappingType === MappingSisyfosType.CHANNEL_BY_LABEL) {
			return `Channel ${m.label}`
		} else {
			assertNever(m)
			return 'Sisyfos'
		}
	} else if (mapping.device === DeviceType.QUANTEL) {
		const m = mapping as MappingQuantel
		return `Quantel ${m.channelId}`
	} else if (mapping.device === DeviceType.VIZMSE) {
		return 'VizMSE'
	} else if (mapping.device === DeviceType.SINGULAR_LIVE) {
		return 'Singular Live'
	} else if (mapping.device === DeviceType.SHOTOKU) {
		return 'Shotoku'
	} else if (mapping.device === DeviceType.VMIX) {
		return `VMix PGM`
	} else if (mapping.device === DeviceType.OBS) {
		return `OBS Scene`
	} else if (mapping.device === DeviceType.SOFIE_CHEF) {
		return `Chef window`
	} else if (mapping.device === DeviceType.TELEMETRICS) {
		return `Telemetrics`
	} else {
		assertNever(mapping.device)
		return 'N/A'
	}
}

type AnyMapping =
	| MappingAbstract
	| MappingAtem
	| MappingCasparCG
	| MappingHTTPSend
	| MappingHTTPWatcher
	| MappingHyperdeck
	| MappingLawo
	| MappingOBS
	| MappingOBSAny
	| MappingOSC
	| MappingPanasonicPtz
	| MappingPharos
	| MappingQuantel
	| MappingShotoku
	| MappingSingularLive
	| MappingSisyfos
	| MappingTCPSend
	| MappingVizMSE
	| MappingVMixAny

function getLastBiggestValue(
	mappings: Mappings,
	filterFunction: (mapping: AnyMapping) => number | false | undefined
): number | undefined {
	let lastBiggest: number | undefined = undefined
	Object.values(mappings).forEach((mapping) => {
		const value = filterFunction(mapping as any)
		if (value !== undefined && value !== false) {
			if (lastBiggest === undefined || value > lastBiggest) {
				lastBiggest = value
			}
		}
	})
	return lastBiggest
}

function getDeviceTypeOrder(deviceType: DeviceType): number {
	const order: DeviceType[] = [
		// First devices will be shown first.

		DeviceType.ABSTRACT,
		DeviceType.CASPARCG,
		DeviceType.QUANTEL,

		DeviceType.VIZMSE,
		DeviceType.SINGULAR_LIVE,

		DeviceType.ATEM,
		DeviceType.VMIX,

		DeviceType.HYPERDECK,
		DeviceType.HTTPSEND,
		DeviceType.TCPSEND,
		DeviceType.OSC,

		DeviceType.OBS,
		DeviceType.SISYFOS,
		DeviceType.LAWO,
		DeviceType.PHAROS,

		DeviceType.SHOTOKU,
		DeviceType.PANASONIC_PTZ,
		DeviceType.HTTPWATCHER,
	]
	const index = order.indexOf(deviceType)
	return index === -1 ? 9999 : index
}

export type SortedMappings = { layerId: string; mapping: Mapping }[]
export function sortMappings(mappings: Mappings): SortedMappings {
	return Object.entries(mappings)
		.map(([layerId, mapping]) => ({
			layerId,
			mapping,
		}))
		.sort((a, b) => {
			if (a.mapping.device !== b.mapping.device) {
				const aDeviceOrder = getDeviceTypeOrder(a.mapping.device)
				const bDeviceOrder = getDeviceTypeOrder(b.mapping.device)

				if (aDeviceOrder > bDeviceOrder) return 1
				if (aDeviceOrder < bDeviceOrder) return -1
			}

			if (a.mapping.deviceId > b.mapping.deviceId) return 1
			if (a.mapping.deviceId < b.mapping.deviceId) return -1

			const device = a.mapping.device
			if (device === DeviceType.ABSTRACT) {
				// Nothing
			} else if (device === DeviceType.CASPARCG) {
				const _a = a.mapping as MappingCasparCG
				const _b = b.mapping as MappingCasparCG
				if (_a.channel > _b.channel) return 1
				if (_a.channel < _b.channel) return -1
				if (_a.layer > _b.layer) return 1
				if (_a.layer < _b.layer) return -1
			} else if (device === DeviceType.ATEM) {
				const _a = a.mapping as MappingAtem
				const _b = b.mapping as MappingAtem
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if ((_a.index || 0) > (_b.index || 0)) return 1
				if ((_a.index || 0) < (_b.index || 0)) return -1
			} else if (device === DeviceType.LAWO) {
				const _a = a.mapping as MappingLawo
				const _b = b.mapping as MappingLawo
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if ((_a.identifier || '') > (_b.identifier || '')) return 1
				if ((_a.identifier || '') < (_b.identifier || '')) return -1
			} else if (device === DeviceType.HTTPSEND) {
				// Nothing
			} else if (device === DeviceType.PANASONIC_PTZ) {
				const _a = a.mapping as MappingPanasonicPtz
				const _b = b.mapping as MappingPanasonicPtz
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.TCPSEND) {
				// Nothing
			} else if (device === DeviceType.HYPERDECK) {
				const _a = a.mapping as MappingHyperdeck
				const _b = b.mapping as MappingHyperdeck
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if ((_a.index || 0) > (_b.index || 0)) return 1
				if ((_a.index || 0) < (_b.index || 0)) return -1
			} else if (device === DeviceType.PHAROS) {
				// Nothing
			} else if (device === DeviceType.OSC) {
				// Nothing
			} else if (device === DeviceType.HTTPWATCHER) {
				// Nothing
			} else if (device === DeviceType.SISYFOS) {
				const _a = a.mapping as MappingSisyfos
				const _b = b.mapping as MappingSisyfos
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.QUANTEL) {
				const _a = a.mapping as MappingQuantel
				const _b = b.mapping as MappingQuantel
				if (_a.portId > _b.portId) return 1
				if (_a.portId < _b.portId) return -1
				if (_a.channelId > _b.channelId) return 1
				if (_a.channelId < _b.channelId) return -1
			} else if (device === DeviceType.VIZMSE) {
				// Nothing
			} else if (device === DeviceType.SINGULAR_LIVE) {
				const _a = a.mapping as MappingSingularLive
				const _b = b.mapping as MappingSingularLive
				if (_a.compositionName > _b.compositionName) return 1
				if (_a.compositionName < _b.compositionName) return -1
			} else if (device === DeviceType.SHOTOKU) {
				// Nothing
			} else if (device === DeviceType.VMIX) {
				const _a = a.mapping as MappingVMixProgram
				const _b = b.mapping as MappingVMixProgram
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if ((_a.index || 0) > (_b.index || 0)) return 1
				if ((_a.index || 0) < (_b.index || 0)) return -1
			} else if (device === DeviceType.OBS) {
				const _a = a.mapping as MappingOBSAny
				const _b = b.mapping as MappingOBSAny
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.SOFIE_CHEF) {
				const _a = a.mapping as MappingSofieChef
				const _b = b.mapping as MappingSofieChef
				if (_a.windowId > _b.windowId) return 1
				if (_a.windowId < _b.windowId) return -1
			} else if (device === DeviceType.TELEMETRICS) {
				// Nothing
			} else {
				assertNever(device)
			}
			if (a.layerId > b.layerId) return 1
			if (a.layerId < b.layerId) return -1
			return 0
		})
}
/** Returns a list of mappings that are compatible with the provided timeline objects */
export function getCompatibleMappings(
	projectMappings: Mappings,
	filterObjects: (TimelineObj | TSRTimelineObj)[]
): SortedMappings {
	return sortMappings(projectMappings).filter((m) => {
		// Filter out incompatible mappings:
		for (const timelineObj of filterObjects) {
			const obj = 'obj' in timelineObj ? timelineObj.obj : timelineObj

			if (!filterMapping(m.mapping, obj)) {
				return false
			}
		}
		return true
	})
}
