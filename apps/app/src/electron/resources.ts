import {
	TSRTimelineObj,
	DeviceType,
	TimelineContentTypeCasparCg,
	TimelineObjAtemME,
	TimelineContentTypeAtem,
	AtemTransitionStyle,
	TimelineObjAtemDSK,
	TimelineObjAtemAUX,
	TimelineObjAtemSsrc,
	TimelineObjAtemSsrcProps,
	TimelineObjAtemMacroPlayer,
	TimelineObjAtemAudioChannel,
	TimelineObjAtemMediaPlayer,
	MediaSourceType,
	TimelineObjOBSCurrentScene,
	TimelineContentTypeOBS,
	TimelineObjOBSCurrentTransition,
	TimelineObjOBSRecording,
	TimelineObjOBSStreaming,
	TimelineObjOBSSceneItemRender,
	TimelineObjOBSMute,
	TimelineObjOBSSourceSettings,
	TimelineObjVMixInput,
	TimelineContentTypeVMix,
	TimelineObjVMixProgram,
	VMixTransitionType,
	TimelineObjVMixAudio,
	TimelineObjVMixOutput,
	TimelineObjVMixOverlay,
	TimelineObjVMixRecording,
	TimelineObjVMixStreaming,
	TimelineObjVMixExternal,
	TimelineObjVMixFadeToBlack,
	TimelineObjVMixFader,
	TimelineObjVMixPreview,
	TimelineObjOSCMessage,
	TimelineContentTypeOSC,
} from 'timeline-state-resolver-types'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever, literal } from '@shared/lib'
import { shortID } from '../lib/util'

export function TSRTimelineObjFromResource(resource: ResourceAny): TSRTimelineObj {
	const INFINITE_DURATION = null

	if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
		return {
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: (resource.duration || 60) * 1000,
			},
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.MEDIA,
				file: resource.name,
			},
		}
	} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
		return {
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: 8 * 1000,
			},
			content: {
				deviceType: DeviceType.CASPARCG,
				type: TimelineContentTypeCasparCg.TEMPLATE,
				templateType: 'html',
				name: resource.name,
				data: JSON.stringify({}),
				useStopCommand: true,
			},
		}
	} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
		throw new Error(`The resource "${resource.resourceType}" can't be added to a timeline.`)
	} else if (resource.resourceType === ResourceType.ATEM_ME) {
		return literal<TimelineObjAtemME>({
			id: shortID(),
			layer: '', // set later,
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.ME,
				me: {
					input: 1,
					transition: AtemTransitionStyle.CUT,
				},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_DSK) {
		return literal<TimelineObjAtemDSK>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.DSK,
				dsk: {
					onAir: true,
					sources: {
						fillSource: 1,
						cutSource: 2,
					},
				},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_AUX) {
		return literal<TimelineObjAtemAUX>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUX,
				aux: {
					input: 1,
				},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_SSRC) {
		return literal<TimelineObjAtemSsrc>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.SSRC,
				ssrc: {
					boxes: [
						{
							enabled: true,
							source: 0,
							x: -758,
							y: 425,
							size: 417,
							cropped: false,
							cropTop: 0,
							cropBottom: 0,
							cropLeft: 0,
							cropRight: 0,
						},
						{
							enabled: true,
							source: 0,
							x: 758,
							y: 425,
							size: 417,
							cropped: false,
							cropTop: 0,
							cropBottom: 0,
							cropLeft: 0,
							cropRight: 0,
						},
						{
							enabled: true,
							source: 0,
							x: -758,
							y: -425,
							size: 417,
							cropped: false,
							cropTop: 0,
							cropBottom: 0,
							cropLeft: 0,
							cropRight: 0,
						},
						{
							enabled: true,
							source: 0,
							x: 758,
							y: -425,
							size: 417,
							cropped: false,
							cropTop: 0,
							cropBottom: 0,
							cropLeft: 0,
							cropRight: 0,
						},
					],
				},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_SSRC_PROPS) {
		return literal<TimelineObjAtemSsrcProps>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.SSRCPROPS,
				ssrcProps: {
					artPreMultiplied: true,
					artFillSource: 0,
					artCutSource: 0,
					artOption: 0,
					borderEnabled: false,
				},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_MACRO_PLAYER) {
		return literal<TimelineObjAtemMacroPlayer>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.MACROPLAYER,
				macroPlayer: {
					macroIndex: 0,
					isRunning: true,
				},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL) {
		return literal<TimelineObjAtemAudioChannel>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.AUDIOCHANNEL,
				audioChannel: {},
			},
		})
	} else if (resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER) {
		return literal<TimelineObjAtemMediaPlayer>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.ATEM,
				type: TimelineContentTypeAtem.MEDIAPLAYER,
				mediaPlayer: {
					sourceType: MediaSourceType.Clip,
					clipIndex: 0,
					stillIndex: 0,
					playing: true,
					loop: false,
					atBeginning: true,
					clipFrame: 0,
				},
			},
		})
	} else if (resource.resourceType === ResourceType.OBS_SCENE) {
		return literal<TimelineObjOBSCurrentScene>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.OBS,
				type: TimelineContentTypeOBS.CURRENT_SCENE,
				sceneName: resource.name,
			},
		})
	} else if (resource.resourceType === ResourceType.OBS_TRANSITION) {
		return literal<TimelineObjOBSCurrentTransition>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.OBS,
				type: TimelineContentTypeOBS.CURRENT_TRANSITION,
				transitionName: resource.name,
			},
		})
	} else if (resource.resourceType === ResourceType.OBS_RECORDING) {
		return literal<TimelineObjOBSRecording>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: { deviceType: DeviceType.OBS, type: TimelineContentTypeOBS.RECORDING, on: true },
		})
	} else if (resource.resourceType === ResourceType.OBS_STREAMING) {
		return literal<TimelineObjOBSStreaming>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: { deviceType: DeviceType.OBS, type: TimelineContentTypeOBS.STREAMING, on: true },
		})
	} else if (resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS) {
		return literal<TimelineObjOBSSourceSettings>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.OBS,
				type: TimelineContentTypeOBS.SOURCE_SETTINGS,
				sourceType: 'dshow_input',
			},
		})
	} else if (resource.resourceType === ResourceType.OBS_MUTE) {
		return literal<TimelineObjOBSMute>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: { deviceType: DeviceType.OBS, type: TimelineContentTypeOBS.MUTE, mute: true },
		})
	} else if (resource.resourceType === ResourceType.OBS_RENDER) {
		return literal<TimelineObjOBSSceneItemRender>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: { deviceType: DeviceType.OBS, type: TimelineContentTypeOBS.SCENE_ITEM_RENDER, on: true },
		})
	} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
		return literal<TimelineObjVMixProgram>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.PROGRAM,
				input: resource.number,
				transition: {
					effect: VMixTransitionType.Cut,
					duration: 0,
				},
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_PREVIEW) {
		return literal<TimelineObjVMixPreview>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.PREVIEW,
				input: 1,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS) {
		return literal<TimelineObjVMixInput>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.INPUT,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS) {
		return literal<TimelineObjVMixAudio>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.AUDIO,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS) {
		return literal<TimelineObjVMixOutput>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.OUTPUT,
				source: 'Input',
				input: 1,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS) {
		return literal<TimelineObjVMixOverlay>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.OVERLAY,
				input: 1,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_RECORDING) {
		return literal<TimelineObjVMixRecording>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.RECORDING,
				on: true,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_STREAMING) {
		return literal<TimelineObjVMixStreaming>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.STREAMING,
				on: true,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_EXTERNAL) {
		return literal<TimelineObjVMixExternal>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.EXTERNAL,
				on: true,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK) {
		return literal<TimelineObjVMixFadeToBlack>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.FADE_TO_BLACK,
				on: true,
			},
		})
	} else if (resource.resourceType === ResourceType.VMIX_FADER) {
		return literal<TimelineObjVMixFader>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: INFINITE_DURATION,
			},
			content: {
				deviceType: DeviceType.VMIX,
				type: TimelineContentTypeVMix.FADER,
				position: 255,
			},
		})
	} else if (resource.resourceType === ResourceType.OSC_MESSAGE) {
		return literal<TimelineObjOSCMessage>({
			id: shortID(),
			layer: '', // set later
			enable: {
				start: 0,
				duration: 1 * 1000,
			},
			content: {
				deviceType: DeviceType.OSC,
				type: TimelineContentTypeOSC.OSC,
				path: '/',
				values: [],
			},
		})
	} else {
		assertNever(resource)
		// @ts-expect-error never
		throw new Error(`Unknown resource type "${resource.resourceType}"`)
	}
}
