import { AppModel } from '@/models/AppModel'
import { mappingsMock } from './mappingsMock'
import { mediaMock } from './mediaMock'
import { rundownsMock } from './rundownsMock'
import { templatesMock } from './templatesMock'

export const appMock: AppModel = {
	rundowns: [...rundownsMock],
	media: mediaMock,
	templates: templatesMock,
	mappings: mappingsMock
}
