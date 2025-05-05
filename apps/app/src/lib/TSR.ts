import {
	DeviceType,
	MappingAtemType,
	MappingObsType,
	MappingPanasonicPTZType,
	MappingVmixType,
} from 'timeline-state-resolver-types'

export const ATEM_DEFAULT_TRANSITION_RATE = 25

export function getAtemFrameRate(): number {
	// This is just a placeholder for now, assuming a frame rate.
	// Ideally, we'd be quering the atem device for the frame rate and cache it.

	return 25
}

export function translateMappingType(deviceType: DeviceType, mappingType: string | undefined): string | undefined {
	// Note: Not all device types need fixing, many didn't use the property as a number when the change was made
	// https://github.com/nrkno/sofie-timeline-state-resolver/pull/237

	switch (deviceType) {
		case DeviceType.ATEM: {
			switch (mappingType as any as number) {
				case 0:
					return MappingAtemType.MixEffect
				case 1:
					return MappingAtemType.DownStreamKeyer
				case 2:
					return MappingAtemType.SuperSourceBox
				case 3:
					return MappingAtemType.Auxilliary
				case 4:
					return MappingAtemType.MediaPlayer
				case 5:
					return MappingAtemType.SuperSourceProperties
				case 6:
					return MappingAtemType.AudioChannel
				case 7:
					return MappingAtemType.MacroPlayer
				case 8:
					return MappingAtemType.AudioRouting
				default:
					return mappingType
			}
		}
		case DeviceType.OBS: {
			switch (mappingType as any as number) {
				case 0:
					return MappingObsType.CurrentTransition
				case 1:
					return MappingObsType.CurrentScene
				case 2:
					return MappingObsType.Recording
				case 3:
					return MappingObsType.Streaming
				case 4:
					return MappingObsType.SceneItem
				case 5:
					return MappingObsType.InputAudio
				case 6:
					return MappingObsType.InputSettings
				default:
					return mappingType
			}
		}
		case DeviceType.PANASONIC_PTZ: {
			switch (mappingType as any as number) {
				case 0:
					return MappingPanasonicPTZType.PresetSpeed
				case 1:
					return MappingPanasonicPTZType.PresetMem
				case 2:
					return MappingPanasonicPTZType.Zoom
				case 3:
					return MappingPanasonicPTZType.ZoomSpeed
				default:
					return mappingType
			}
		}
		case DeviceType.VMIX: {
			switch (mappingType as any as number) {
				case 0:
					return MappingVmixType.Program
				case 1:
					return MappingVmixType.Preview
				case 2:
					return MappingVmixType.Input
				case 3:
					return MappingVmixType.AudioChannel
				case 4:
					return MappingVmixType.Output
				case 5:
					return MappingVmixType.Overlay
				case 6:
					return MappingVmixType.Recording
				case 7:
					return MappingVmixType.Streaming
				case 8:
					return MappingVmixType.External
				case 9:
					return MappingVmixType.FadeToBlack
				case 10:
					return MappingVmixType.Fader
				case 11:
					return MappingVmixType.Script
				default:
					return mappingType
			}
		}
	}

	return mappingType
}

export function translateTSRDeviceType(deviceType: DeviceType): DeviceType {
	// https://github.com/nrkno/sofie-timeline-state-resolver/pull/237

	if (typeof deviceType === 'number') {
		return oldDeviceTypeToNewMapping[deviceType] || deviceType
	}
	return deviceType
}

enum OldDeviceType {
	ABSTRACT = 0,
	CASPARCG = 1,
	ATEM = 2,
	LAWO = 3,
	HTTPSEND = 4,
	PANASONIC_PTZ = 5,
	TCPSEND = 6,
	HYPERDECK = 7,
	PHAROS = 8,
	OSC = 9,
	HTTPWATCHER = 10,
	SISYFOS = 11,
	QUANTEL = 12,
	VIZMSE = 13,
	SINGULAR_LIVE = 14,
	SHOTOKU = 15,
	VMIX = 20,
	OBS = 21,
	SOFIE_CHEF = 22,
	TELEMETRICS = 23,
	TRICASTER = 24,
	MULTI_OSC = 25,
}

const oldDeviceTypeToNewMapping = {
	[OldDeviceType.ABSTRACT]: DeviceType.ABSTRACT,
	[OldDeviceType.CASPARCG]: DeviceType.CASPARCG,
	[OldDeviceType.ATEM]: DeviceType.ATEM,
	[OldDeviceType.LAWO]: DeviceType.LAWO,
	[OldDeviceType.HTTPSEND]: DeviceType.HTTPSEND,
	[OldDeviceType.PANASONIC_PTZ]: DeviceType.PANASONIC_PTZ,
	[OldDeviceType.TCPSEND]: DeviceType.TCPSEND,
	[OldDeviceType.HYPERDECK]: DeviceType.HYPERDECK,
	[OldDeviceType.PHAROS]: DeviceType.PHAROS,
	[OldDeviceType.OSC]: DeviceType.OSC,
	[OldDeviceType.HTTPWATCHER]: DeviceType.HTTPWATCHER,
	[OldDeviceType.SISYFOS]: DeviceType.SISYFOS,
	[OldDeviceType.QUANTEL]: DeviceType.QUANTEL,
	[OldDeviceType.VIZMSE]: DeviceType.VIZMSE,
	[OldDeviceType.SINGULAR_LIVE]: DeviceType.SINGULAR_LIVE,
	[OldDeviceType.SHOTOKU]: DeviceType.SHOTOKU,
	[OldDeviceType.VMIX]: DeviceType.VMIX,
	[OldDeviceType.OBS]: DeviceType.OBS,
	[OldDeviceType.SOFIE_CHEF]: DeviceType.SOFIE_CHEF,
	[OldDeviceType.TELEMETRICS]: DeviceType.TELEMETRICS,
	[OldDeviceType.TRICASTER]: DeviceType.TRICASTER,
	[OldDeviceType.MULTI_OSC]: DeviceType.MULTI_OSC,
}
