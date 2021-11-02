import { literal } from '@/lib'
import { AppModel } from '@/models/AppModel'
import { DeviceType, MappingCasparCG } from 'timeline-state-resolver-types'
import { mediaMock } from './mediaMock'
import { rundownsMock } from './rundownsMock'

export const appMock: AppModel = {
	rundowns: [...rundownsMock],
	media: mediaMock,
	mappings: {
		casparLayer0: literal<MappingCasparCG>({
			device: DeviceType.CASPARCG,
			deviceId: 'caspar0',
			channel: 1,
			layer: 10,
		}),
		casparLayer1: literal<MappingCasparCG>({
			device: DeviceType.CASPARCG,
			deviceId: 'caspar0',
			channel: 1,
			layer: 11,
		}),
		casparLayer2: literal<MappingCasparCG>({
			device: DeviceType.CASPARCG,
			deviceId: 'caspar0',
			channel: 1,
			layer: 12,
		}),
	},
}
