import { RundownModel } from '@/models/RundownModel'

export const rundownsMock: RundownModel[] = [
	{
		name: 'Introduction',
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
					deviceType: 1, // DeviceType.CASPARCG,
					type: 'media', // TimelineContentTypeCasparCg.MEDIA,
					file: 'trailer',
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
					deviceType: 1, // DeviceType.CASPARCG,
					type: 'media', // TimelineContentTypeCasparCg.MEDIA,
					file: 'amb',
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
					deviceType: 1, // DeviceType.CASPARCG,
					type: 'media', // TimelineContentTypeCasparCg.MEDIA,
					file: 'trailer',
				},
			},
		],
	},
]
