import { assertNever, literal } from '@shared/lib'
import {
	DeviceType,
	Mapping,
	MappingAbstract,
	MappingAtem,
	MappingAtemType,
	MappingCasparCG,
	MappingHTTPSend,
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
	} else {
		assertNever(obj.content)
		return false
	}
}

export function getMappingFromTimelineObject(obj: TSRTimelineObj, deviceId: string): Mapping | undefined {
	if (obj.content.deviceType === DeviceType.ABSTRACT) {
		return literal<MappingAbstract>({
			device: DeviceType.ABSTRACT,
			deviceId: deviceId,
			layerName: 'Abstract',
		})
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		// MappingAtem

		switch (obj.content.type) {
			case TimelineContentTypeAtem.ME:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem ME 1',
					mappingType: MappingAtemType.MixEffect,
					index: 0,
				})

			case TimelineContentTypeAtem.DSK:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem DSK 1',
					mappingType: MappingAtemType.DownStreamKeyer,
					index: 0,
				})

			case TimelineContentTypeAtem.SSRC:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem SS 1',
					mappingType: MappingAtemType.SuperSourceBox,
					index: 0,
				})

			case TimelineContentTypeAtem.AUX:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem AUX 1',
					mappingType: MappingAtemType.Auxilliary,
					index: 0,
				})

			case TimelineContentTypeAtem.MEDIAPLAYER:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem MP 1',
					mappingType: MappingAtemType.MediaPlayer,
					index: 0,
				})

			case TimelineContentTypeAtem.SSRCPROPS:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem SS 1 props',
					mappingType: MappingAtemType.SuperSourceProperties,
					index: 0,
				})

			case TimelineContentTypeAtem.AUDIOCHANNEL:
				return literal<MappingAtem>({
					device: DeviceType.ATEM,
					deviceId: deviceId,
					layerName: 'Atem Audio 1',
					mappingType: MappingAtemType.AudioChannel,
					index: 0,
				})

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
		return literal<MappingCasparCG>({
			device: DeviceType.CASPARCG,
			deviceId: deviceId,
			layerName: 'CasparCG 1-10',
			channel: 1,
			layer: 10,
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
					layerName: 'Hyperdeck 1',
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
			case TimelineContentTypeVMix.INPUT:
				return literal<MappingVMixAny>({
					device: DeviceType.VMIX,
					deviceId: deviceId,
					layerName: 'Input',
					mappingType: MappingVMixType.Input,
					index: 1,
				})
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
			return 'Hyperdeck'
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
		default:
			assertNever(deviceType)
	}

	return 'Unknown'
}

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
		default:
			assertNever(mapping.device)
			return ''
	}
}

export function getDefaultMappingForDeviceType(deviceType: DeviceType, deviceId: string, mappings: Mappings) {
	if (deviceType === DeviceType.CASPARCG) {
		const lastChannel = getLastBiggestValue<MappingCasparCG>(mappings, deviceType, 'channel')
		const lastLayer = getLastBiggestValue<MappingCasparCG>(mappings, deviceType, 'layer')
		return literal<MappingCasparCG>({
			channel: lastChannel ? lastChannel : 1,
			layer: lastLayer ? lastLayer + 10 : 10,
			device: deviceType,
			deviceId,
		})
	}

	if (deviceType === DeviceType.ATEM) {
		const lastIndex = getLastBiggestValue<MappingAtem>(mappings, deviceType, 'index')
		return literal<MappingAtem>({
			index: lastIndex ? lastIndex + 1 : 1,
			device: deviceType,
			deviceId,
			mappingType: MappingAtemType.MixEffect,
		})
	}

	if (deviceType === DeviceType.VMIX) {
		return literal<MappingVMixProgram>({
			index: 1,
			device: deviceType,
			deviceId,
			mappingType: MappingVMixType.Program,
		})
	}

	if (deviceType === DeviceType.OBS) {
		return literal<MappingOBS>({
			device: deviceType,
			deviceId,
			mappingType: MappingOBSType.CurrentScene,
		})
	}

	if (deviceType === DeviceType.OSC) {
		return literal<MappingOSC>({
			device: deviceType,
			deviceId,
		})
	}

	return literal<Mapping>({
		device: deviceType,
		deviceId: deviceId,
	})
}

function getLastBiggestValue<T extends Mapping>(mappings: Mappings, deviceType: DeviceType, property: keyof T) {
	let lastBiggest: number | undefined = undefined
	Object.entries(mappings).forEach(([_mappingId, mapping]) => {
		const existingPropVal = (mapping as any)[property] as number
		if (mapping.device === deviceType) {
			if (lastBiggest === undefined) {
				lastBiggest = existingPropVal
			} else if (existingPropVal > lastBiggest) {
				lastBiggest = existingPropVal
			}
		}
	})
	return lastBiggest
}
