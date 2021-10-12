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
					duration: 5 * 1000,
				},
				content: {
					deviceType: 1, // DeviceType.CASPARCG,
					type: 'media', // TimelineContentTypeCasparCg.MEDIA,
					file: 'bbb_trailer',
				},
			},
		],
	},
]
