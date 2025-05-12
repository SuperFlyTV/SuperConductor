import { assertNever, literal } from '@shared/lib'
import { ResourceAny, ResourceType, TSRDeviceId, protectString, unprotectString } from '@shared/models'
import { GDDSchema } from 'graphics-data-definition'
import {
	DeviceType,
	Mapping,
	SomeMappingAbstract,
	SomeMappingAtem,
	MappingAtemType,
	SomeMappingCasparCG,
	SomeMappingHttpSend,
	SomeMappingHttpWatcher,
	SomeMappingHyperdeck,
	MappingHyperdeckType,
	SomeMappingLawo,
	MappingLawoType,
	SomeMappingObs,
	MappingObsType,
	SomeMappingOsc,
	SomeMappingPanasonicPTZ,
	MappingPanasonicPTZType,
	SomeMappingPharos,
	SomeMappingQuantel,
	Mappings,
	SomeMappingShotoku,
	SomeMappingSingularLive,
	SomeMappingSisyfos,
	MappingSisyfosType,
	SomeMappingSofieChef,
	SomeMappingTcpSend,
	SomeMappingTricaster,
	MappingTricasterType,
	SomeMappingVizMSE,
	SomeMappingVmix,
	MappingVmixProgram,
	MappingVmixType,
	TimelineContentTypeAtem,
	TimelineContentTypeHyperdeck,
	TimelineContentTypeLawo,
	TimelineContentTypeOBS,
	TimelineContentTypePanasonicPtz,
	TimelineContentTypeSisyfos,
	TimelineContentTypeTriCaster,
	TimelineContentTypeVMix,
	TriCasterAudioChannelName,
	TriCasterInputName,
	TriCasterKeyerName,
	TriCasterMatrixOutputName,
	TriCasterMixEffectName,
	TriCasterMixOutputName,
	TSRMappingOptions,
	TSRTimelineContent,
	TSRTimelineObj,
	MappingCasparCGType,
	MappingQuantelType,
	MappingSingularLiveType,
	MappingSofieChefType,
	SomeMappingTelemetrics,
	SomeMappingMultiOsc,
	MappingMultiOscType,
	MappingAtemMixEffect,
} from 'timeline-state-resolver-types'
import { Project } from '../models/project/Project.js'
import { listAvailableDeviceIDs } from './util.js'
import { TimelineObj } from '../models/rundown/TimelineObj.js'

/** Returns true if the given mapping - TSRTimelineObject-combination is valid */
export function filterMapping(mapping: Mapping<TSRMappingOptions>, obj: TSRTimelineObj<TSRTimelineContent>): boolean {
	if (mapping.device !== obj.content.deviceType) return false

	if (obj.content.deviceType === DeviceType.ABSTRACT) {
		// MappingAbstract
		return true
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		const atemMapping = mapping.options as SomeMappingAtem

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
			case TimelineContentTypeAtem.AUDIOROUTING:
				return atemMapping.mappingType === MappingAtemType.AudioRouting
			case TimelineContentTypeAtem.COLORGENERATOR:
				return atemMapping.mappingType === MappingAtemType.ColorGenerator
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
		const hyperdeckMapping = mapping.options as SomeMappingHyperdeck

		switch (obj.content.type) {
			case TimelineContentTypeHyperdeck.TRANSPORT:
				return hyperdeckMapping.mappingType === MappingHyperdeckType.Transport
			default:
				assertNever(obj.content)
				return false
		}
	} else if (obj.content.deviceType === DeviceType.LAWO) {
		const lawoMapping = mapping.options as SomeMappingLawo

		switch (obj.content.type) {
			case TimelineContentTypeLawo.SOURCE:
				return lawoMapping.mappingType === MappingLawoType.Source
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
		const obsMapping = mapping.options as SomeMappingObs

		switch (obj.content.type) {
			case TimelineContentTypeOBS.CURRENT_TRANSITION:
				return obsMapping.mappingType === MappingObsType.CurrentTransition
			case TimelineContentTypeOBS.CURRENT_SCENE:
				return obsMapping.mappingType === MappingObsType.CurrentScene
			case TimelineContentTypeOBS.RECORDING:
				return obsMapping.mappingType === MappingObsType.Recording
			case TimelineContentTypeOBS.STREAMING:
				return obsMapping.mappingType === MappingObsType.Streaming
			case TimelineContentTypeOBS.INPUT_AUDIO:
				return obsMapping.mappingType === MappingObsType.InputAudio
			case TimelineContentTypeOBS.INPUT_MEDIA:
				return obsMapping.mappingType === MappingObsType.InputMedia
			case TimelineContentTypeOBS.INPUT_SETTINGS:
				return obsMapping.mappingType === MappingObsType.InputSettings
			case TimelineContentTypeOBS.SCENE_ITEM:
				return obsMapping.mappingType === MappingObsType.SceneItem
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
		const panasonicPtzMapping = mapping.options as SomeMappingPanasonicPTZ

		switch (obj.content.type) {
			case TimelineContentTypePanasonicPtz.SPEED:
				return panasonicPtzMapping.mappingType === MappingPanasonicPTZType.PresetSpeed
			case TimelineContentTypePanasonicPtz.PRESET:
				return panasonicPtzMapping.mappingType === MappingPanasonicPTZType.PresetMem
			case TimelineContentTypePanasonicPtz.ZOOM:
				return panasonicPtzMapping.mappingType === MappingPanasonicPTZType.Zoom
			case TimelineContentTypePanasonicPtz.ZOOM_SPEED:
				return panasonicPtzMapping.mappingType === MappingPanasonicPTZType.ZoomSpeed
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
		const sisyfosMapping = mapping.options as SomeMappingSisyfos

		switch (obj.content.type) {
			case TimelineContentTypeSisyfos.CHANNEL:
				return (
					sisyfosMapping.mappingType === MappingSisyfosType.Channel ||
					sisyfosMapping.mappingType === MappingSisyfosType.ChannelByLabel
				)
			case TimelineContentTypeSisyfos.CHANNELS:
				return sisyfosMapping.mappingType === MappingSisyfosType.Channels
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
		const vmixMapping = mapping.options as SomeMappingVmix

		switch (obj.content.type) {
			case TimelineContentTypeVMix.PROGRAM:
				return vmixMapping.mappingType === MappingVmixType.Program
			case TimelineContentTypeVMix.PREVIEW:
				return vmixMapping.mappingType === MappingVmixType.Preview
			case TimelineContentTypeVMix.INPUT:
				return vmixMapping.mappingType === MappingVmixType.Input
			case TimelineContentTypeVMix.AUDIO:
				return vmixMapping.mappingType === MappingVmixType.AudioChannel
			case TimelineContentTypeVMix.OUTPUT:
				return vmixMapping.mappingType === MappingVmixType.Output
			case TimelineContentTypeVMix.OVERLAY:
				return vmixMapping.mappingType === MappingVmixType.Overlay
			case TimelineContentTypeVMix.RECORDING:
				return vmixMapping.mappingType === MappingVmixType.Recording
			case TimelineContentTypeVMix.STREAMING:
				return vmixMapping.mappingType === MappingVmixType.Streaming
			case TimelineContentTypeVMix.EXTERNAL:
				return vmixMapping.mappingType === MappingVmixType.External
			case TimelineContentTypeVMix.FADE_TO_BLACK:
				return vmixMapping.mappingType === MappingVmixType.FadeToBlack
			case TimelineContentTypeVMix.FADER:
				return vmixMapping.mappingType === MappingVmixType.Fader
			case TimelineContentTypeVMix.SCRIPT:
				return vmixMapping.mappingType === MappingVmixType.Script
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
	} else if (obj.content.deviceType === DeviceType.TRICASTER) {
		const triCasterMapping = mapping.options as SomeMappingTricaster

		switch (obj.content.type) {
			case TimelineContentTypeTriCaster.ME:
				return triCasterMapping.mappingType === MappingTricasterType.ME
			case TimelineContentTypeTriCaster.AUDIO_CHANNEL:
				return triCasterMapping.mappingType === MappingTricasterType.AUDIOCHANNEL
			case TimelineContentTypeTriCaster.DSK:
				return triCasterMapping.mappingType === MappingTricasterType.DSK
			case TimelineContentTypeTriCaster.INPUT:
				return triCasterMapping.mappingType === MappingTricasterType.INPUT
			case TimelineContentTypeTriCaster.MATRIX_OUTPUT:
				return triCasterMapping.mappingType === MappingTricasterType.MATRIXOUTPUT
			case TimelineContentTypeTriCaster.MIX_OUTPUT:
				return triCasterMapping.mappingType === MappingTricasterType.MIXOUTPUT
			default:
				assertNever(obj.content)
				return false
		}
	} else {
		assertNever(obj.content)
		return false
	}
}

/** Tries to guess which device a timelineObject is likely to be using */
export function guessDeviceIdFromTimelineObject(
	project: Project,
	obj: TSRTimelineObj<TSRTimelineContent>
): TSRDeviceId | undefined {
	const allDeviceIds = listAvailableDeviceIDs(project.bridges)
	const sortedMappings = sortMappings(project.mappings)

	for (const { mapping } of sortedMappings) {
		// Does the layer have a device?
		if (!allDeviceIds.has(protectString<TSRDeviceId>(mapping.deviceId))) continue
		// Is the layer compatible?
		if (!filterMapping(mapping, obj)) continue

		return protectString(mapping.deviceId)
	}
	return undefined
}
export function getMappingFromTimelineObject(
	obj: TSRTimelineObj<TSRTimelineContent>,
	deviceId: TSRDeviceId,
	resource: ResourceAny | undefined
): Mapping<TSRMappingOptions> | undefined {
	const deviceIdStr = unprotectString(deviceId)
	if (obj.content.deviceType === DeviceType.ABSTRACT) {
		return literal<Mapping<SomeMappingAbstract>>({
			device: DeviceType.ABSTRACT,
			deviceId: deviceIdStr,
			layerName: 'Abstract',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		// MappingAtem

		switch (obj.content.type) {
			case TimelineContentTypeAtem.ME: {
				const index = resource?.resourceType === ResourceType.ATEM_ME ? resource.index : 0
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem ME ${index + 1}`,
					options: {
						mappingType: MappingAtemType.MixEffect,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.DSK: {
				const index = resource?.resourceType === ResourceType.ATEM_DSK ? resource.index : 0
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem DSK ${index + 1}`,
					options: {
						mappingType: MappingAtemType.DownStreamKeyer,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.SSRC: {
				const index = resource?.resourceType === ResourceType.ATEM_SSRC ? resource.index : 0
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem SS ${index + 1}`,
					options: {
						mappingType: MappingAtemType.SuperSourceBox,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.AUX: {
				const index = resource?.resourceType === ResourceType.ATEM_AUX ? resource.index : 0
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem AUX ${index + 1}`,
					options: {
						mappingType: MappingAtemType.Auxilliary,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.MEDIAPLAYER: {
				const index = resource?.resourceType === ResourceType.ATEM_MEDIA_PLAYER ? resource.index : 0
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem MP ${index + 1}`,
					options: {
						mappingType: MappingAtemType.MediaPlayer,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.SSRCPROPS: {
				const index = resource?.resourceType === ResourceType.ATEM_SSRC_PROPS ? resource.index : 0
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem SS ${index + 1} props`,
					options: {
						mappingType: MappingAtemType.SuperSourceProperties,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.AUDIOCHANNEL: {
				const index = resource?.resourceType === ResourceType.ATEM_AUDIO_CHANNEL ? resource.index : 0

				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem Audio ${index + 1}`,
					options: {
						mappingType: MappingAtemType.AudioChannel,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.MACROPLAYER:
				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: 'Atem Macro',
					options: {
						mappingType: MappingAtemType.MacroPlayer,
					},
				})

			case TimelineContentTypeAtem.AUDIOROUTING: {
				const index = resource?.resourceType === ResourceType.ATEM_AUDIO_OUTPUT ? resource.index : 0

				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem Audio Routing ${index + 1}`,
					options: {
						mappingType: MappingAtemType.AudioRouting,
						index,
					},
				})
			}

			case TimelineContentTypeAtem.COLORGENERATOR: {
				const index = resource?.resourceType === ResourceType.ATEM_COLOR_GENERATOR ? resource.index : 0

				return literal<Mapping<SomeMappingAtem>>({
					device: DeviceType.ATEM,
					deviceId: deviceIdStr,
					layerName: `Atem Color Generator ${index + 1}`,
					options: {
						mappingType: MappingAtemType.ColorGenerator,
						index,
					},
				})
			}

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
		return literal<Mapping<SomeMappingCasparCG>>({
			device: DeviceType.CASPARCG,
			deviceId: deviceIdStr,
			layerName: `CasparCG ${channel}-${layer}`,
			options: {
				mappingType: MappingCasparCGType.Layer,
				channel: channel,
				layer: layer,
			},
		})
	} else if (obj.content.deviceType === DeviceType.HTTPSEND) {
		// MappingHTTPSend
		return literal<Mapping<SomeMappingHttpSend>>({
			device: DeviceType.HTTPSEND,
			deviceId: deviceIdStr,
			layerName: 'HTTP Send',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.TCPSEND) {
		// MappingTCPSend
		return literal<Mapping<SomeMappingTcpSend>>({
			device: DeviceType.TCPSEND,
			deviceId: deviceIdStr,
			layerName: 'TCP Send',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.HYPERDECK) {
		// MappingHyperdeck

		switch (obj.content.type) {
			case TimelineContentTypeHyperdeck.TRANSPORT:
				return literal<Mapping<SomeMappingHyperdeck>>({
					device: DeviceType.HYPERDECK,
					deviceId: deviceIdStr,
					layerName: 'HyperDeck 1',
					options: {
						mappingType: MappingHyperdeckType.Transport,
					},
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.LAWO) {
		// MappingLawo

		switch (obj.content.type) {
			case TimelineContentTypeLawo.SOURCE:
			case TimelineContentTypeLawo.SOURCES:
				return literal<Mapping<SomeMappingLawo>>({
					device: DeviceType.LAWO,
					deviceId: deviceIdStr,
					layerName: 'Lawo source',
					options: {
						mappingType: MappingLawoType.Source,
						identifier: '',
					},
				})
			case TimelineContentTypeLawo.EMBER_PROPERTY:
				return literal<Mapping<SomeMappingLawo>>({
					device: DeviceType.LAWO,
					deviceId: deviceIdStr,
					layerName: 'Lawo property',
					options: {
						mappingType: MappingLawoType.Fullpath,
					},
				})
			case TimelineContentTypeLawo.TRIGGER_VALUE:
				return literal<Mapping<SomeMappingLawo>>({
					device: DeviceType.LAWO,
					deviceId: deviceIdStr,
					layerName: 'Lawo Trigger',
					options: {
						mappingType: MappingLawoType.TriggerValue,
					},
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.OBS) {
		// MappingOBS

		switch (obj.content.type) {
			case TimelineContentTypeOBS.CURRENT_TRANSITION:
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: 'OBS Transition',
					options: {
						mappingType: MappingObsType.CurrentTransition,
					},
				})
			case TimelineContentTypeOBS.CURRENT_SCENE:
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: 'OBS Scene',
					options: {
						mappingType: MappingObsType.CurrentScene,
					},
				})
			case TimelineContentTypeOBS.RECORDING:
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: 'OBS Record',
					options: {
						mappingType: MappingObsType.Recording,
					},
				})
			case TimelineContentTypeOBS.STREAMING:
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: 'OBS Streaming',
					options: {
						mappingType: MappingObsType.Streaming,
					},
				})
			case TimelineContentTypeOBS.SCENE_ITEM:
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: 'OBS Item render',
					options: {
						mappingType: MappingObsType.SceneItem,
						sceneName: '',
						source: '',
					},
				})
			case TimelineContentTypeOBS.INPUT_AUDIO: {
				const input = resource?.resourceType === ResourceType.OBS_INPUT_AUDIO ? resource.input : ''
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: `OBS Input Audio: ${input}`,
					options: {
						mappingType: MappingObsType.InputAudio,
						input: input,
					},
				})
			}
			case TimelineContentTypeOBS.INPUT_SETTINGS: {
				const input = resource?.resourceType === ResourceType.OBS_INPUT_SETTINGS ? resource.input : ''
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: `OBS Input settings: ${input}`,
					options: {
						mappingType: MappingObsType.InputSettings,
						input: input,
					},
				})
			}
			case TimelineContentTypeOBS.INPUT_MEDIA: {
				const input = resource?.resourceType === ResourceType.OBS_INPUT_MEDIA ? resource.input : ''
				return literal<Mapping<SomeMappingObs>>({
					device: DeviceType.OBS,
					deviceId: deviceIdStr,
					layerName: `OBS Input Media: ${input}`,
					options: {
						mappingType: MappingObsType.InputMedia,
						input: input,
					},
				})
			}
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.OSC) {
		// MappingOSC
		return literal<Mapping<SomeMappingOsc>>({
			device: DeviceType.OSC,
			deviceId: deviceIdStr,
			layerName: 'OSC',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.PHAROS) {
		// MappingPharos
		return literal<Mapping<SomeMappingPharos>>({
			device: DeviceType.PHAROS,
			deviceId: deviceIdStr,
			layerName: 'Pharos',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.PANASONIC_PTZ) {
		// MappingPanasonicPtz

		switch (obj.content.type) {
			case TimelineContentTypePanasonicPtz.SPEED:
				return literal<Mapping<SomeMappingPanasonicPTZ>>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceIdStr,
					layerName: 'PTZ Speed',
					options: {
						mappingType: MappingPanasonicPTZType.PresetSpeed,
					},
				})
			case TimelineContentTypePanasonicPtz.PRESET:
				return literal<Mapping<SomeMappingPanasonicPTZ>>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceIdStr,
					layerName: 'PTZ Preset',
					options: {
						mappingType: MappingPanasonicPTZType.PresetMem,
					},
				})
			case TimelineContentTypePanasonicPtz.ZOOM:
				return literal<Mapping<SomeMappingPanasonicPTZ>>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceIdStr,
					layerName: 'PTZ Zoom',
					options: {
						mappingType: MappingPanasonicPTZType.Zoom,
					},
				})
			case TimelineContentTypePanasonicPtz.ZOOM_SPEED:
				return literal<Mapping<SomeMappingPanasonicPTZ>>({
					device: DeviceType.PANASONIC_PTZ,
					deviceId: deviceIdStr,
					layerName: 'PTZ Zoom Speed',
					options: {
						mappingType: MappingPanasonicPTZType.ZoomSpeed,
					},
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.QUANTEL) {
		// MappingQuantel
		return literal<Mapping<SomeMappingQuantel>>({
			device: DeviceType.QUANTEL,
			deviceId: deviceIdStr,
			layerName: 'Quantel 1',
			options: {
				mappingType: MappingQuantelType.Port,
				channelId: 1,
				portId: 'port-id',
			},
		})
	} else if (obj.content.deviceType === DeviceType.SHOTOKU) {
		// MappingShotoku
		return literal<Mapping<SomeMappingShotoku>>({
			device: DeviceType.SHOTOKU,
			deviceId: deviceIdStr,
			layerName: 'Shotoku',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.SISYFOS) {
		// MappingSisyfos

		switch (obj.content.type) {
			case TimelineContentTypeSisyfos.CHANNEL:
			case TimelineContentTypeSisyfos.TRIGGERVALUE:
				return literal<Mapping<SomeMappingSisyfos>>({
					device: DeviceType.SISYFOS,
					deviceId: deviceIdStr,
					layerName: 'Channel 1',
					options: {
						mappingType: MappingSisyfosType.Channel,
						channel: 0,
						setLabelToLayerName: true,
					},
				})
			case TimelineContentTypeSisyfos.CHANNELS:
				return literal<Mapping<SomeMappingSisyfos>>({
					device: DeviceType.SISYFOS,
					deviceId: deviceIdStr,
					layerName: 'Channels',
					options: {
						mappingType: MappingSisyfosType.Channels,
					},
				})

			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.SINGULAR_LIVE) {
		// MappingSingularLive
		return literal<Mapping<SomeMappingSingularLive>>({
			device: DeviceType.SINGULAR_LIVE,
			deviceId: deviceIdStr,
			layerName: 'Singular Live',
			options: {
				mappingType: MappingSingularLiveType.Composition,
				compositionName: 'composition-name',
			},
		})
	} else if (obj.content.deviceType === DeviceType.VMIX) {
		// MappingVMix

		switch (obj.content.type) {
			case TimelineContentTypeVMix.PROGRAM:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Program',
					options: {
						mappingType: MappingVmixType.Program,
						index: 1,
					},
				})
			case TimelineContentTypeVMix.PREVIEW:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Preview',
					options: {
						mappingType: MappingVmixType.Preview,
						index: 1,
					},
				})
			case TimelineContentTypeVMix.INPUT: {
				const index = resource?.resourceType === ResourceType.VMIX_INPUT ? resource.number + '' : '1'
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Input',
					options: {
						mappingType: MappingVmixType.Input,
						index,
					},
				})
			}
			case TimelineContentTypeVMix.AUDIO:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'AudioChannel',
					options: {
						mappingType: MappingVmixType.AudioChannel,
						index: '1',
					},
				})
			case TimelineContentTypeVMix.OUTPUT:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Output',
					options: {
						mappingType: MappingVmixType.Output,
						index: '2',
					},
				})
			case TimelineContentTypeVMix.OVERLAY:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Overlay',
					options: {
						mappingType: MappingVmixType.Overlay,
						index: 1,
					},
				})
			case TimelineContentTypeVMix.RECORDING:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Recording',
					options: {
						mappingType: MappingVmixType.Recording,
					},
				})
			case TimelineContentTypeVMix.STREAMING:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Streaming',
					options: {
						mappingType: MappingVmixType.Streaming,
					},
				})
			case TimelineContentTypeVMix.EXTERNAL:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'External',
					options: {
						mappingType: MappingVmixType.External,
					},
				})
			case TimelineContentTypeVMix.FADE_TO_BLACK:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'FadeToBlack',
					options: {
						mappingType: MappingVmixType.FadeToBlack,
					},
				})
			case TimelineContentTypeVMix.FADER:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Fader',
					options: {
						mappingType: MappingVmixType.Fader,
					},
				})
			case TimelineContentTypeVMix.SCRIPT:
				return literal<Mapping<SomeMappingVmix>>({
					device: DeviceType.VMIX,
					deviceId: deviceIdStr,
					layerName: 'Script',
					options: {
						mappingType: MappingVmixType.Script,
					},
				})
			default:
				assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.VIZMSE) {
		// MappingVizMSE
		return literal<Mapping<SomeMappingVizMSE>>({
			device: DeviceType.VIZMSE,
			deviceId: deviceIdStr,
			layerName: 'VizMSE',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.SOFIE_CHEF) {
		return literal<Mapping<SomeMappingSofieChef>>({
			device: DeviceType.SOFIE_CHEF,
			deviceId: deviceIdStr,
			layerName: 'Chef window',
			options: {
				mappingType: MappingSofieChefType.Window,
				windowId: 'default',
			},
		})
	} else if (obj.content.deviceType === DeviceType.TELEMETRICS) {
		return literal<Mapping<SomeMappingTelemetrics>>({
			device: DeviceType.TELEMETRICS,
			deviceId: deviceIdStr,
			layerName: 'Telemetrics',
			options: {},
		})
	} else if (obj.content.deviceType === DeviceType.TRICASTER) {
		switch (obj.content.type) {
			case TimelineContentTypeTriCaster.ME: {
				const name =
					resource?.resourceType === ResourceType.TRICASTER_ME
						? (resource.name as TriCasterMixEffectName) // TODO: perhaps resource.name should be of this type?
						: 'main'
				return literal<Mapping<SomeMappingTricaster>>({
					deviceId: deviceIdStr,
					device: DeviceType.TRICASTER,
					layerName: `TriCaster ME ${name}`,
					options: {
						mappingType: MappingTricasterType.ME,
						name,
					},
				})
			}
			case TimelineContentTypeTriCaster.AUDIO_CHANNEL: {
				const name =
					resource?.resourceType === ResourceType.TRICASTER_AUDIO_CHANNEL
						? (resource.name as TriCasterAudioChannelName) // TODO: perhaps resource.name should be of this type?
						: 'master'
				return literal<Mapping<SomeMappingTricaster>>({
					deviceId: deviceIdStr,
					device: DeviceType.TRICASTER,
					layerName: `TriCaster Audio Channel ${name}`,
					options: {
						mappingType: MappingTricasterType.AUDIOCHANNEL,
						name,
					},
				})
			}
			case TimelineContentTypeTriCaster.DSK: {
				const name =
					resource?.resourceType === ResourceType.TRICASTER_DSK
						? (resource.name as TriCasterKeyerName) // TODO: perhaps resource.name should be of this type?
						: 'dsk1'
				return literal<Mapping<SomeMappingTricaster>>({
					deviceId: deviceIdStr,
					device: DeviceType.TRICASTER,
					layerName: `TriCaster DSK ${name}`,
					options: {
						mappingType: MappingTricasterType.DSK,
						name,
					},
				})
			}
			case TimelineContentTypeTriCaster.INPUT: {
				const name =
					resource?.resourceType === ResourceType.TRICASTER_INPUT
						? (resource.name as TriCasterInputName) // TODO: perhaps resource.name should be of this type?
						: 'input1'
				return literal<Mapping<SomeMappingTricaster>>({
					deviceId: deviceIdStr,
					device: DeviceType.TRICASTER,
					layerName: `TriCaster Input ${name}`,
					options: {
						mappingType: MappingTricasterType.INPUT,
						name,
					},
				})
			}
			case TimelineContentTypeTriCaster.MATRIX_OUTPUT: {
				const name =
					resource?.resourceType === ResourceType.TRICASTER_MATRIX_OUTPUT
						? (resource.name as TriCasterMatrixOutputName) // TODO: perhaps resource.name should be of this type?
						: 'out1'
				return literal<Mapping<SomeMappingTricaster>>({
					deviceId: deviceIdStr,
					device: DeviceType.TRICASTER,
					layerName: `TriCaster Matrix Out ${name}`,
					options: {
						mappingType: MappingTricasterType.MATRIXOUTPUT,
						name,
					},
				})
			}
			case TimelineContentTypeTriCaster.MIX_OUTPUT: {
				const name =
					resource?.resourceType === ResourceType.TRICASTER_MIX_OUTPUT
						? (resource.name as TriCasterMixOutputName) // TODO: perhaps resource.name should be of this type?
						: 'mix1'
				return literal<Mapping<SomeMappingTricaster>>({
					deviceId: deviceIdStr,
					device: DeviceType.TRICASTER,
					layerName: `TriCaster Mix Out ${name}`,
					options: {
						mappingType: MappingTricasterType.MIXOUTPUT,
						name,
					},
				})
			}
			default:
				assertNever(obj.content)
		}
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
		case DeviceType.TRICASTER:
			return 'TriCaster'
		case DeviceType.MULTI_OSC:
			return 'Multi OSC'
		default:
			assertNever(deviceType)
	}

	return 'Unknown'
}

/** Returns a short textual description of the Mapping */
export function describeMappingConfiguration(mapping: Mapping<TSRMappingOptions>): string {
	switch (mapping.device) {
		case DeviceType.ABSTRACT:
			return ''
		case DeviceType.CASPARCG: {
			const typedMapping = mapping.options as SomeMappingCasparCG
			return `Channel: ${typedMapping.channel}, Layer: ${typedMapping.layer}`
		}
		case DeviceType.ATEM: {
			const typedMapping = mapping.options as SomeMappingAtem
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
					return `Macro Player`
				case MappingAtemType.AudioRouting:
					return `Audio Output: ${typedMapping.index}`
				case MappingAtemType.ColorGenerator:
					return `Color Generator ${typedMapping.index}`
				default:
					assertNever(typedMapping)
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
			const typedMapping = mapping.options as SomeMappingVmix
			switch (typedMapping.mappingType) {
				case MappingVmixType.AudioChannel:
					return `Index: ${typedMapping.index}, Input Layer: ${typedMapping.inputLayer}`
				case MappingVmixType.External:
					return ''
				case MappingVmixType.FadeToBlack:
					return ''
				case MappingVmixType.Fader:
					return ''
				case MappingVmixType.Input:
					return `Index: ${typedMapping.index}`
				case MappingVmixType.Output:
					return `Index: ${typedMapping.index}`
				case MappingVmixType.Overlay:
					return `Index: ${typedMapping.index}`
				case MappingVmixType.Preview:
					return `Index: ${typedMapping.index}`
				case MappingVmixType.Program:
					return `Index: ${typedMapping.index}`
				case MappingVmixType.Recording:
					return ''
				case MappingVmixType.Streaming:
					return ''
				case MappingVmixType.Script:
					return ''
				default:
					assertNever(typedMapping)
					return ''
			}
		}
		case DeviceType.OBS: {
			const typedMapping = mapping.options as SomeMappingObs
			switch (typedMapping.mappingType) {
				case MappingObsType.CurrentScene:
					return ''
				case MappingObsType.CurrentTransition:
					return ''
				case MappingObsType.Recording:
					return ''
				case MappingObsType.Streaming: {
					return ''
				}
				case MappingObsType.InputAudio: {
					return `Audio Input: ${typedMapping.input}`
				}
				case MappingObsType.InputMedia: {
					return `Media Input: ${typedMapping.input}`
				}
				case MappingObsType.InputSettings: {
					return `Input Settings: ${typedMapping.input}`
				}
				case MappingObsType.SceneItem:
					return `Scene: ${typedMapping.sceneName}, Source: ${typedMapping.source}`

				default:
					assertNever(typedMapping)
					return ''
			}
		}
		case DeviceType.SOFIE_CHEF: {
			const typedMapping = mapping.options as SomeMappingSofieChef
			return `Window ${typedMapping.windowId}`
		}
		case DeviceType.TELEMETRICS: {
			return ''
		}
		case DeviceType.TRICASTER: {
			return ''
		}
		case DeviceType.MULTI_OSC: {
			return ''
		}
		default:
			assertNever(mapping.device)
			return ''
	}
}

export function getDefaultMappingForDeviceType(
	deviceType: DeviceType,
	deviceId: TSRDeviceId,
	allMappings: Mappings<TSRMappingOptions>
): Mapping<TSRMappingOptions> {
	const deviceIdStr = unprotectString(deviceId)
	// Filter mapping for deviceId:
	const mappings: Mappings<TSRMappingOptions> = {}
	for (const [id, mapping] of Object.entries<Mapping<TSRMappingOptions>>(allMappings)) {
		if (protectString(mapping.deviceId) === deviceId) mappings[id] = mapping
	}

	if (deviceType === DeviceType.ABSTRACT) {
		const m = literal<Mapping<SomeMappingAbstract>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.CASPARCG) {
		const channel =
			getLastBiggestValue(
				mappings,
				(m) => m.device === deviceType && (m.options as SomeMappingCasparCG).channel
			) ?? 1
		const layer =
			(getLastBiggestValue(
				mappings,
				(m) => m.device === deviceType && (m.options as SomeMappingCasparCG).layer
			) ?? 0) + 10

		const m = literal<Mapping<SomeMappingCasparCG>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingCasparCGType.Layer,
				channel,
				layer,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.ATEM) {
		const index =
			(getLastBiggestValue(
				mappings,
				(m) => m.device === deviceType && (m.options as MappingAtemMixEffect).index
			) ?? 0) + 1
		const m = literal<Mapping<SomeMappingAtem>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingAtemType.MixEffect,
				index,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.LAWO) {
		const m = literal<Mapping<SomeMappingLawo>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingLawoType.Source,
				identifier: '',
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.HTTPSEND) {
		const m = literal<Mapping<SomeMappingHttpSend>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.PANASONIC_PTZ) {
		const m = literal<Mapping<SomeMappingPanasonicPTZ>>({
			device: DeviceType.PANASONIC_PTZ,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingPanasonicPTZType.PresetMem,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.TCPSEND) {
		const m = literal<Mapping<SomeMappingTcpSend>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.HYPERDECK) {
		const m = literal<Mapping<SomeMappingHyperdeck>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingHyperdeckType.Transport,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.PHAROS) {
		const m = literal<Mapping<SomeMappingPharos>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.OSC) {
		const m = literal<Mapping<SomeMappingOsc>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.HTTPWATCHER) {
		const m = literal<Mapping<SomeMappingHttpWatcher>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SISYFOS) {
		const channel =
			(getLastBiggestValue(
				mappings,
				(m) =>
					m.device === deviceType && m.options.mappingType === MappingSisyfosType.Channel && m.options.channel
			) ?? -1) + 1
		const m = literal<Mapping<SomeMappingSisyfos>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingSisyfosType.Channel,
				channel,
				setLabelToLayerName: true,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.QUANTEL) {
		const channelId =
			(getLastBiggestValue(
				mappings,
				(m) => m.device === deviceType && (m.options as SomeMappingQuantel).channelId
			) ?? 0) + 1

		const m = literal<Mapping<SomeMappingQuantel>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingQuantelType.Port,
				portId: 'port-id',
				channelId,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.VIZMSE) {
		const m = literal<Mapping<SomeMappingVizMSE>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SINGULAR_LIVE) {
		const m = literal<Mapping<SomeMappingSingularLive>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingSingularLiveType.Composition,
				compositionName: 'composition-name',
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SHOTOKU) {
		const m = literal<Mapping<SomeMappingShotoku>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.VMIX) {
		const m = literal<Mapping<MappingVmixProgram>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingVmixType.Program,
				index: 1,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.OBS) {
		const m = literal<Mapping<SomeMappingObs>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingObsType.CurrentScene,
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.SOFIE_CHEF) {
		const m = literal<Mapping<SomeMappingSofieChef>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingSofieChefType.Window,
				windowId: 'default',
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.TELEMETRICS) {
		const m = literal<Mapping<SomeMappingTelemetrics>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.TRICASTER) {
		const m = literal<Mapping<SomeMappingTricaster>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingTricasterType.ME,
				name: 'main',
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else if (deviceType === DeviceType.MULTI_OSC) {
		const m = literal<Mapping<SomeMappingMultiOsc>>({
			device: deviceType,
			deviceId: deviceIdStr,
			layerName: '', // Set later
			options: {
				mappingType: MappingMultiOscType.Layer,
				connectionId: 'default',
			},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	} else {
		assertNever(deviceType)
		const m = literal<Mapping<any>>({
			device: deviceType,
			deviceId: deviceIdStr,
			options: {},
		})
		m.layerName = getDefaultLayerName(m)
		return m
	}
}
export function getDefaultLayerName(mapping: Mapping<TSRMappingOptions>): string {
	if (mapping.device === DeviceType.ABSTRACT) {
		return `Abstract`
	} else if (mapping.device === DeviceType.CASPARCG) {
		const m = mapping.options as SomeMappingCasparCG
		return `CasparCG ${m.channel}-${m.layer}`
	} else if (mapping.device === DeviceType.ATEM) {
		const m = mapping.options as MappingAtemMixEffect
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
		return `HyperDeck`
	} else if (mapping.device === DeviceType.PHAROS) {
		return `Pharos`
	} else if (mapping.device === DeviceType.OSC) {
		return `OSC`
	} else if (mapping.device === DeviceType.HTTPWATCHER) {
		return `HTTP watcher`
	} else if (mapping.device === DeviceType.SISYFOS) {
		const m = mapping.options as SomeMappingSisyfos
		if (m.mappingType === MappingSisyfosType.Channel) {
			return `Channel ${m.channel + 1}`
		} else if (m.mappingType === MappingSisyfosType.Channels) {
			return `Channels`
		} else if (m.mappingType === MappingSisyfosType.ChannelByLabel) {
			return `Channel ${m.label}`
		} else {
			assertNever(m)
			return 'Sisyfos'
		}
	} else if (mapping.device === DeviceType.QUANTEL) {
		const m = mapping.options as SomeMappingQuantel
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
	} else if (mapping.device === DeviceType.TRICASTER) {
		return `TriCaster`
	} else if (mapping.device === DeviceType.MULTI_OSC) {
		return `Multi OSC`
	} else {
		assertNever(mapping.device)
		return 'N/A'
	}
}

function getLastBiggestValue(
	mappings: Mappings<TSRMappingOptions>,
	filterFunction: (mapping: Mapping<TSRMappingOptions>) => number | false | undefined
): number | undefined {
	let lastBiggest: number | undefined = undefined
	Object.values<Mapping<TSRMappingOptions>>(mappings).forEach((mapping) => {
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
		DeviceType.TRICASTER,

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

export type SortedMappings = { layerId: string; mapping: Mapping<TSRMappingOptions> }[]
export function sortMappings(mappings: Mappings<TSRMappingOptions>): SortedMappings {
	return Object.entries<Mapping<TSRMappingOptions>>(mappings)
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
				const _a = a.mapping.options as SomeMappingCasparCG
				const _b = b.mapping.options as SomeMappingCasparCG
				if (_a.channel > _b.channel) return 1
				if (_a.channel < _b.channel) return -1
				if (_a.layer > _b.layer) return 1
				if (_a.layer < _b.layer) return -1
			} else if (device === DeviceType.ATEM) {
				const _a = a.mapping.options as SomeMappingAtem
				const _b = b.mapping.options as SomeMappingAtem
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if (_a.mappingType !== MappingAtemType.MacroPlayer && _b.mappingType !== MappingAtemType.MacroPlayer) {
					if ((_a.index || 0) > (_b.index || 0)) return 1
					if ((_a.index || 0) < (_b.index || 0)) return -1
				}
			} else if (device === DeviceType.LAWO) {
				const _a = a.mapping.options as SomeMappingLawo
				const _b = b.mapping.options as SomeMappingLawo
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if (_a.mappingType === MappingLawoType.Source && _b.mappingType === MappingLawoType.Source) {
					if ((_a.identifier || '') > (_b.identifier || '')) return 1
					if ((_a.identifier || '') < (_b.identifier || '')) return -1
				}
			} else if (device === DeviceType.HTTPSEND) {
				// Nothing
			} else if (device === DeviceType.PANASONIC_PTZ) {
				const _a = a.mapping.options as SomeMappingPanasonicPTZ
				const _b = b.mapping.options as SomeMappingPanasonicPTZ
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.TCPSEND) {
				// Nothing
			} else if (device === DeviceType.HYPERDECK) {
				const _a = a.mapping.options as SomeMappingHyperdeck
				const _b = b.mapping.options as SomeMappingHyperdeck
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.PHAROS) {
				// Nothing
			} else if (device === DeviceType.OSC) {
				// Nothing
			} else if (device === DeviceType.HTTPWATCHER) {
				// Nothing
			} else if (device === DeviceType.SISYFOS) {
				const _a = a.mapping.options as SomeMappingSisyfos
				const _b = b.mapping.options as SomeMappingSisyfos
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.QUANTEL) {
				const _a = a.mapping.options as SomeMappingQuantel
				const _b = b.mapping.options as SomeMappingQuantel
				if (_a.portId > _b.portId) return 1
				if (_a.portId < _b.portId) return -1
				if (_a.channelId > _b.channelId) return 1
				if (_a.channelId < _b.channelId) return -1
			} else if (device === DeviceType.VIZMSE) {
				// Nothing
			} else if (device === DeviceType.SINGULAR_LIVE) {
				const _a = a.mapping.options as SomeMappingSingularLive
				const _b = b.mapping.options as SomeMappingSingularLive
				if (_a.compositionName > _b.compositionName) return 1
				if (_a.compositionName < _b.compositionName) return -1
			} else if (device === DeviceType.SHOTOKU) {
				// Nothing
			} else if (device === DeviceType.VMIX) {
				const _a = a.mapping.options as MappingVmixProgram
				const _b = b.mapping.options as MappingVmixProgram
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				if ((_a.index || 0) > (_b.index || 0)) return 1
				if ((_a.index || 0) < (_b.index || 0)) return -1
			} else if (device === DeviceType.OBS) {
				const _a = a.mapping.options as SomeMappingObs
				const _b = b.mapping.options as SomeMappingObs
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
			} else if (device === DeviceType.SOFIE_CHEF) {
				const _a = a.mapping.options as SomeMappingSofieChef
				const _b = b.mapping.options as SomeMappingSofieChef
				if (_a.windowId > _b.windowId) return 1
				if (_a.windowId < _b.windowId) return -1
			} else if (device === DeviceType.TELEMETRICS) {
				// Nothing
			} else if (device === DeviceType.TRICASTER) {
				const _a = a.mapping.options as SomeMappingTricaster
				const _b = b.mapping.options as SomeMappingTricaster
				if (_a.mappingType > _b.mappingType) return 1
				if (_a.mappingType < _b.mappingType) return -1
				return compareStringsEndingWithNumber(_a.name ?? '', _b.name ?? '') // TODO: find a better alternative
			} else if (device === DeviceType.MULTI_OSC) {
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
	projectMappings: Mappings<TSRMappingOptions>,
	filterObjects: (TimelineObj | TSRTimelineObj<TSRTimelineContent>)[]
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

// for strings like input1, input2, ..., input10, ...
function compareStringsEndingWithNumber(a: string, b: string) {
	const regex = /(\D+)|(\d+)/g
	const aParts = a.match(regex) ?? [a, '0']
	const bParts = b.match(regex) ?? [b, '0']

	const alphabeticComparison = aParts[0].localeCompare(bParts[0])

	if (alphabeticComparison === 0) {
		const numA = parseInt(aParts[1])
		const numB = parseInt(bParts[1])
		return numA - numB
	}

	return alphabeticComparison
}
