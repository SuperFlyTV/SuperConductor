import { AppModel } from '@/models/AppModel'
import { mediaMock } from './mediaMock'
import { rundownsMock } from './rundownsMock'

export const appMock: AppModel = { rundowns: [...rundownsMock], media: mediaMock }
