import { ClientMethods, ServiceName, ServiceTypes } from '../IPCAPI'

import { EverythingService } from '../../electron/EverythingService'
import { PartService } from '../../electron/api/PartService'
import { ProjectService } from '../../electron/api/ProjectService'
import { ReportingService } from '../../electron/api/ReportingService'
import { RundownService } from '../../electron/api/RundownService'
import { GroupService } from '../../electron/api/GroupService'

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
			if (serviceType === ServiceName.LEGACY) continue // skip legacy service

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
			if (serviceType === ServiceName.LEGACY) continue // skip legacy service

			const serviceMethods = (services as any)[serviceType]

			for (const method of clientMethods) {
				if (typeof serviceMethods[method] !== 'function') {
					nonexistantMethods.push(`${serviceType}.${method}`)
				}
			}
		}
		expect(nonexistantMethods).toHaveLength(0)
	})
})
