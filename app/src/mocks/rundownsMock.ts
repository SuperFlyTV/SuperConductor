import { RundownModel } from '@/models/RundownModel'
import { DeviceType, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'

export const rundownsMock: RundownModel[] = [
	{
		name: 'Introduction',
		type: 'rundown',
		timeline: [
			{
				id: 'graphic0',
				layer: 'casparLayer2',
				enable: {
					start: 3000,
					duration: 10 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.TEMPLATE,
					file: 'lower-third',
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
		],
	},
]
