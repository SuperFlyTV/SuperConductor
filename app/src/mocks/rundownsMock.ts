import { literal } from '@/lib'
import { RundownModel } from '@/models/RundownModel'
import { DeviceType, MappingCasparCG, Mappings, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'

interface GUIModel {
	layers: string[] // in the order they are to be displayed in the GUI
}

export const rundownsMock: RundownModel[] = literal<RundownModel[]>([
	{
		name: 'Introduction',
		type: 'rundown',
		timeline: [
			{
				id: 'graphic0',
				layer: 'casparLayer2',
				enable: {
					start: 3000,
					duration: 5 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.TEMPLATE,
					templateType: 'html',
					name: 'lower-third',
					data: JSON.stringify({ _label: 'Timed Player Thingy' }),
					useStopCommand: true,
				},
			},
			{
				id: 'image0',
				layer: 'casparLayer1',
				enable: {
					start: 2000,
					duration: 3 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: 'amb',
				},
			},
			{
				id: 'video0',
				layer: 'casparLayer0',
				enable: {
					start: 0,
					duration: 10 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: 'trailer',
				},
			},
		],
	},
	{
		name: 'Only trailer',
		type: 'rundown',
		timeline: [
			{
				id: 'video0',
				layer: 'casparLayer0',
				enable: {
					start: 0,
					duration: 10 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: 'trailer',
				},
			},
			{
				id: 'video1',
				layer: 'casparLayer0',
				enable: {
					start: 10 * 1000,
					duration: 10 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: 'trailer2',
				},
			},
		],
	},
])

export const layerMappings: Mappings = {
	caspar_video: literal<MappingCasparCG>({
		device: DeviceType.CASPARCG,
		deviceId: 'caspar0',
		channel: 1,
		layer: 9,
	}),
	caspar_gfx: literal<MappingCasparCG>({
		device: DeviceType.CASPARCG,
		deviceId: 'caspar0',
		channel: 1,
		layer: 10,
	}),
}
