import { AppModel } from '@/models/AppModel'
import { DeviceType, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'
import { mappingsMock } from './mappingsMock'
import { mediaMock } from './mediaMock'
import { rundownsMock } from './rundownsMock'
import { templatesMock } from './templatesMock'

export const appMock: AppModel = {
	rundowns: [
		...rundownsMock,
		{
			id: 'group1',
			name: 'Group 1',
			type: 'group',
			loop: true,
			rundowns: [
				{
					id: 'rundown2',
					name: 'Group Intro 1',
					type: 'rundown',
					timeline: [
						{
							id: 'rd2i0',
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
							id: 'rd2i1',
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
							id: 'rd2i2',
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
			],
		},
	],
	media: mediaMock,
	templates: templatesMock,
	mappings: mappingsMock,
}
