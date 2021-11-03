import { literal } from '@/lib'
import { RundownModel } from '@/models/RundownModel'
import { DeviceType, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'

export const rundownsMock: RundownModel[] = literal<RundownModel[]>([
	{
		id: 'rundown1',
		name: 'Introduction',
		type: 'rundown',
		timeline: [
			{
				id: 'graphic0',
				layer: 'casparCGLayer2',
				enable: {
					start: 3000,
					duration: 5 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.TEMPLATE,
					templateType: 'html',
					name: 'LOWER-THIRD',
					data: JSON.stringify({ _title: 'Timed Player Thingy', _subtitle: 'Abcd' }),
					useStopCommand: true,
				},
			},
			{
				id: 'image0',
				layer: 'casparCGLayer1',
				enable: {
					start: 2000,
					duration: 3 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: 'LIVAJA',
				},
			},
			{
				id: 'video0',
				layer: 'casparCGLayer0',
				enable: {
					start: 0,
					duration: 10 * 1000,
				},
				content: {
					deviceType: DeviceType.CASPARCG,
					type: TimelineContentTypeCasparCg.MEDIA,
					file: 'AMB',
				},
			},
		],
	},
])
