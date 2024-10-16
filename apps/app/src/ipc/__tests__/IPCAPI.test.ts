// eslint-disable-next-line n/no-extraneous-import
import { jest } from '@jest/globals'
import { ClientMethods, ServiceName, ServiceTypes } from '../IPCAPI.js'

// Mock electron as it doesn't provide sensible exports during tests
jest.unstable_mockModule('electron', () => ({
	dialog: null,
}))

// Delay import after the mock ahs been setup
const { EverythingService } = await import('../../electron/EverythingService.js')
const { PartService } = await import('../../electron/api/PartService.js')
const { ProjectService } = await import('../../electron/api/ProjectService.js')
const { ReportingService } = await import('../../electron/api/ReportingService.js')
const { RundownService } = await import('../../electron/api/RundownService.js')
const { GroupService } = await import('../../electron/api/GroupService.js')

describe('ClientMethods', () => {
	const services: ServiceTypes = {
		[ServiceName.GROUPS]: GroupService.prototype,
		[ServiceName.LEGACY]: EverythingService.prototype,
		[ServiceName.PARTS]: PartService.prototype,
		[ServiceName.PROJECTS]: ProjectService.prototype,
		[ServiceName.REPORTING]: ReportingService.prototype,
		[ServiceName.RUNDOWNS]: RundownService.prototype,
	}
	test('ClientMethods has all methods', () => {
		const missingMethods: string[] = []
		const IGNORE_METHODS = ['constructor', 'getMaxListeners']
		for (const [serviceType, service] of Object.entries(services)) {
			if ((serviceType as ServiceName) === ServiceName.LEGACY) continue // skip legacy service

			const clientServiceMethods = (ClientMethods as any)[serviceType]

			for (const method of Object.getOwnPropertyNames(service)) {
				if (typeof (service as any)[method] === 'function') {
					if (IGNORE_METHODS.includes(method)) continue
					if (!clientServiceMethods.includes(method)) {
						missingMethods.push(`${serviceType}.${method}`)
					}
				} else {
					throw new Error(`Method "${method}" on service "${serviceType}" is not a function`)
				}
			}
		}
		expect(missingMethods).toHaveLength(0)
	})
	test('methods in ClientMethods exist in services', () => {
		const nonexistantMethods: string[] = []

		for (const [serviceType, clientMethods] of Object.entries(ClientMethods)) {
			if ((serviceType as ServiceName) === ServiceName.LEGACY) continue // skip legacy service

			const serviceMethods = (services as any)[serviceType]

			for (const method of clientMethods) {
				if (typeof serviceMethods[method] !== 'function') {
					nonexistantMethods.push(`${serviceType}.${String(method)}`)
				}
			}
		}
		expect(nonexistantMethods).toHaveLength(0)
	})
})
