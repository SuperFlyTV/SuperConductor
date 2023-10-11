import { getResourceIdFromResource, getResourceIdFromTimelineObj, literal } from '@shared/lib'
import {
	AtemAudioChannel,
	AtemAudioOutput,
	AtemAux,
	AtemDsk,
	AtemMacroPlayer,
	AtemMe,
	AtemMediaPlayer,
	AtemSsrc,
	AtemSsrcProps,
	CasparCGMedia,
	CasparCGTemplate,
	HTTPRequest,
	HyperdeckPlay,
	HyperdeckPreview,
	HyperdeckRecord,
	OBSMute,
	OBSRecording,
	OBSRender,
	OBSScene,
	OBSSourceSettings,
	OBSStreaming,
	OBSTransition,
	OSCMessage,
	protectString,
	ResourceAny,
	ResourceId,
	ResourceType,
	TCPRequest,
	TSRDeviceId,
	VMixAudioSettings,
	VMixExternal,
	VMixFader,
	VMixFadeToBlack,
	VMixInput,
	VMixInputSettings,
	VMixOutputSettings,
	VMixOverlaySettings,
	VMixPreview,
	VMixRecording,
	VMixStreaming,
	VMixScript,
	TriCasterMe,
	TriCasterMixOutput,
	TriCasterDsk,
	TriCasterInput,
	TriCasterMatrixOutput,
	TriCasterAudioChannel
} from '@shared/models'
import { Mappings, TSRTimelineContent, TSRTimelineObj } from 'timeline-state-resolver-types'
import { TSRTimelineObjFromResource } from '../resources'
import { getMappingFromTimelineObject } from '../TSRMappings'
describe('resourceId generation', () => {
	const testedResourceTypes: ResourceType[] = []
	function testResource(r: ResourceAny) {
		testedResourceTypes.push(r.resourceType)

		r.id = getResourceIdFromResource(r)

		// Generate timelineObj from resource:
		const obj: TSRTimelineObj<TSRTimelineContent> = TSRTimelineObjFromResource(r)

		const mapping = getMappingFromTimelineObject(obj, DEVICE_ID, r)
		if (!mapping) throw new Error('Mapping is undefined')
		expect(mapping.deviceId).toBe(DEVICE_ID)

		const mappings: Mappings = { myMapping: mapping }
		obj.layer = 'myMapping'

		// Ensure that the resourceId generated from the timelineObj
		// is the same as the one generated from the resource:
		expect(getResourceIdFromTimelineObj(obj, mappings)).toBe(r.id)
	}
	const DEVICE_ID = protectString<TSRDeviceId>('myDevice0')
	const COMMON = {
		deviceId: DEVICE_ID,
		id: protectString<ResourceId>(''), // set by getResourceIdFromResource() later
		displayName: 'asdf',
	}
	test('CASPARCG_SERVER', () => {
		// Not supported
		testedResourceTypes.push(ResourceType.CASPARCG_SERVER)
		expect(1).toBe(1)
	})
	test('CASPARCG_MEDIA', () => {
		testResource(
			literal<CasparCGMedia>({
				...COMMON,
				resourceType: ResourceType.CASPARCG_MEDIA,
				type: 'video',
				name: 'amb.mp4',
				size: 123,
				changed: 1,
				frames: 414,
				frameTime: '',
				frameRate: 50,
				duration: 1000,
			})
		)
	})
	test('CASPARCG_TEMPLATE', () => {
		testResource(
			literal<CasparCGTemplate>({
				...COMMON,
				resourceType: ResourceType.CASPARCG_TEMPLATE,
				name: 'l3rd.html',
				size: 1234,
				changed: 1,
			})
		)
	})
	test('ATEM_SSRC', () => {
		testResource(
			literal<AtemSsrc>({
				...COMMON,
				resourceType: ResourceType.ATEM_SSRC,
				index: 123,
				displayName: `ATEM SuperSource`,
			})
		)
	})
	test('ATEM_ME', () => {
		testResource(
			literal<AtemMe>({
				...COMMON,
				resourceType: ResourceType.ATEM_ME,
				index: 4,
				displayName: `ATEM ME `,
			})
		)
	})
	test('ATEM_DSK', () => {
		testResource(
			literal<AtemDsk>({
				...COMMON,
				resourceType: ResourceType.ATEM_DSK,
				index: 2,
				displayName: `ATEM DSK`,
			})
		)
	})
	test('ATEM_AUX', () => {
		testResource(
			literal<AtemAux>({
				...COMMON,
				resourceType: ResourceType.ATEM_AUX,
				index: 3,
				displayName: `ATEM AUX }`,
			})
		)
	})
	test('ATEM_SSRC', () => {
		testResource(
			literal<AtemSsrc>({
				...COMMON,
				resourceType: ResourceType.ATEM_SSRC,
				index: 4,
				displayName: `ATEM SuperSource`,
			})
		)
	})
	test('ATEM_SSRC_PROPS', () => {
		testResource(
			literal<AtemSsrcProps>({
				...COMMON,
				resourceType: ResourceType.ATEM_SSRC_PROPS,
				index: 5,
				displayName: `ATEM SuperSource Props`,
			})
		)
	})
	test('ATEM_MACRO_PLAYER', () => {
		testResource(
			literal<AtemMacroPlayer>({
				...COMMON,
				resourceType: ResourceType.ATEM_MACRO_PLAYER,
				displayName: 'ATEM Macro Player',
			})
		)
	})
	test('ATEM_AUDIO_CHANNEL', () => {
		testResource(
			literal<AtemAudioChannel>({
				...COMMON,
				resourceType: ResourceType.ATEM_AUDIO_CHANNEL,
				index: 14,
				displayName: `ATEM Audio Channel`,
			})
		)
	})
	test('ATEM_AUDIO_CHANNEL', () => {
		testResource(
			literal<AtemAudioChannel>({
				...COMMON,
				resourceType: ResourceType.ATEM_AUDIO_CHANNEL,
				index: 7,
				displayName: `ATEM Audio Channel`,
			})
		)
	})
	test('ATEM_AUDIO_OUTPUT', () => {
		testResource(
			literal<AtemAudioOutput>({
				...COMMON,
				resourceType: ResourceType.ATEM_AUDIO_OUTPUT,
				index: 7,
				displayName: `ATEM Audio Output`,
			})
		)
	})
	test('ATEM_MEDIA_PLAYER', () => {
		testResource(
			literal<AtemMediaPlayer>({
				...COMMON,
				resourceType: ResourceType.ATEM_MEDIA_PLAYER,
				index: 6,
			})
		)
	})
	test('OBS_SCENE', () => {
		testResource(
			literal<OBSScene>({
				...COMMON,
				resourceType: ResourceType.OBS_SCENE,
				name: 'scene 1',
			})
		)
	})
	test('OBS_TRANSITION', () => {
		testResource(
			literal<OBSTransition>({
				...COMMON,
				resourceType: ResourceType.OBS_TRANSITION,
				name: 'trans 1',
			})
		)
	})
	test('OBS_RECORDING', () => {
		testResource(
			literal<OBSRecording>({
				...COMMON,
				resourceType: ResourceType.OBS_RECORDING,
			})
		)
	})
	test('OBS_STREAMING', () => {
		testResource(
			literal<OBSStreaming>({
				...COMMON,
				resourceType: ResourceType.OBS_STREAMING,
			})
		)
	})
	test('OBS_SOURCE_SETTINGS', () => {
		testResource(
			literal<OBSSourceSettings>({
				...COMMON,
				resourceType: ResourceType.OBS_SOURCE_SETTINGS,
			})
		)
	})
	test('OBS_MUTE', () => {
		testResource(
			literal<OBSMute>({
				...COMMON,
				resourceType: ResourceType.OBS_MUTE,
			})
		)
	})
	test('OBS_RENDER', () => {
		testResource(
			literal<OBSRender>({
				...COMMON,
				resourceType: ResourceType.OBS_RENDER,
			})
		)
	})
	test('VMIX_INPUT', () => {
		testResource(
			literal<VMixInput>({
				...COMMON,
				resourceType: ResourceType.VMIX_INPUT,
				number: 3,
				type: 'sdi',
			})
		)
	})
	test('VMIX_PREVIEW', () => {
		testResource(
			literal<VMixPreview>({
				...COMMON,
				resourceType: ResourceType.VMIX_PREVIEW,
			})
		)
	})
	test('VMIX_INPUT_SETTINGS', () => {
		testResource(
			literal<VMixInputSettings>({
				...COMMON,
				resourceType: ResourceType.VMIX_INPUT_SETTINGS,
			})
		)
	})
	test('VMIX_AUDIO_SETTINGS', () => {
		testResource(
			literal<VMixAudioSettings>({
				...COMMON,
				resourceType: ResourceType.VMIX_AUDIO_SETTINGS,
			})
		)
	})
	test('VMIX_OUTPUT_SETTINGS', () => {
		testResource(
			literal<VMixOutputSettings>({
				...COMMON,
				resourceType: ResourceType.VMIX_OUTPUT_SETTINGS,
			})
		)
	})
	test('VMIX_OVERLAY_SETTINGS', () => {
		testResource(
			literal<VMixOverlaySettings>({
				...COMMON,
				resourceType: ResourceType.VMIX_OVERLAY_SETTINGS,
			})
		)
	})
	test('VMIX_RECORDING', () => {
		testResource(
			literal<VMixRecording>({
				...COMMON,
				resourceType: ResourceType.VMIX_RECORDING,
			})
		)
	})
	test('VMIX_STREAMING', () => {
		testResource(
			literal<VMixStreaming>({
				...COMMON,
				resourceType: ResourceType.VMIX_STREAMING,
			})
		)
	})
	test('VMIX_EXTERNAL', () => {
		testResource(
			literal<VMixExternal>({
				...COMMON,
				resourceType: ResourceType.VMIX_EXTERNAL,
			})
		)
	})
	test('VMIX_FADE_TO_BLACK', () => {
		testResource(
			literal<VMixFadeToBlack>({
				...COMMON,
				resourceType: ResourceType.VMIX_FADE_TO_BLACK,
			})
		)
	})
	test('VMIX_FADER', () => {
		testResource(
			literal<VMixFader>({
				...COMMON,
				resourceType: ResourceType.VMIX_FADER,
			})
		)
	})
	test('VMIX_SCRIPT', () => {
		testResource(
			literal<VMixScript>({
				...COMMON,
				resourceType: ResourceType.VMIX_SCRIPT,
			})
		)
	})
	test('OSC_MESSAGE', () => {
		testResource(
			literal<OSCMessage>({
				...COMMON,
				resourceType: ResourceType.OSC_MESSAGE,
			})
		)
	})
	test('HTTP_REQUEST', () => {
		testResource(
			literal<HTTPRequest>({
				...COMMON,
				resourceType: ResourceType.HTTP_REQUEST,
			})
		)
	})
	test('HYPERDECK_PLAY', () => {
		testResource(
			literal<HyperdeckPlay>({
				...COMMON,
				resourceType: ResourceType.HYPERDECK_PLAY,
			})
		)
	})
	test('HYPERDECK_RECORD', () => {
		testResource(
			literal<HyperdeckRecord>({
				...COMMON,
				resourceType: ResourceType.HYPERDECK_RECORD,
			})
		)
	})
	test('HYPERDECK_PREVIEW', () => {
		testResource(
			literal<HyperdeckPreview>({
				...COMMON,
				resourceType: ResourceType.HYPERDECK_PREVIEW,
			})
		)
	})
	test('HYPERDECK_CLIP', () => {
		// skip for now
		testedResourceTypes.push(ResourceType.HYPERDECK_CLIP)
		// testResource(
		// 	literal<HyperdeckClip>({
		// 		...COMMON,
		// 		resourceType: ResourceType.HYPERDECK_CLIP,
		// 		clipId: 2,
		// 		clipName: 'myClip',
		// 		slotId: 1,
		// 	})
		// )
	})
	test('TCP_REQUEST', () => {
		testResource(
			literal<TCPRequest>({
				...COMMON,
				resourceType: ResourceType.TCP_REQUEST,
			})
		)
	})
	test('TRICASTER_ME', () => {
		testResource(
			literal<TriCasterMe>({
				...COMMON,
				name: 'main',
				resourceType: ResourceType.TRICASTER_ME,
			})
		)
	})
	test('TRICASTER_DSK', () => {
		testResource(
			literal<TriCasterDsk>({
				...COMMON,
				name: 'dsk1',
				resourceType: ResourceType.TRICASTER_DSK,
			})
		)
	})
	test('TRICASTER_INPUT', () => {
		testResource(
			literal<TriCasterInput>({
				...COMMON,
				name: 'input1',
				resourceType: ResourceType.TRICASTER_INPUT,
			})
		)
	})
	test('TRICASTER_AUDIO_CHANNEL', () => {
		testResource(
			literal<TriCasterAudioChannel>({
				...COMMON,
				name: 'input1',
				resourceType: ResourceType.TRICASTER_AUDIO_CHANNEL,
			})
		)
	})
	test('TRICASTER_MIX_OUTPUT', () => {
		testResource(
			literal<TriCasterMixOutput>({
				...COMMON,
				name: 'mix1',
				resourceType: ResourceType.TRICASTER_MIX_OUTPUT,
			})
		)
	})
	test('TRICASTER_MATRIX_OUTPUT', () => {
		testResource(
			literal<TriCasterMatrixOutput>({
				...COMMON,
				name: 'out1',
				resourceType: ResourceType.TRICASTER_MATRIX_OUTPUT,
			})
		)
	})
	test('INVALID', () => {
		// Not supported
		testedResourceTypes.push(ResourceType.INVALID)
		expect(1).toBe(1)
	})
	afterAll(() => {
		for (const key of Object.keys(ResourceType)) {
			expect(testedResourceTypes).toContain(key)
		}
	})
})
