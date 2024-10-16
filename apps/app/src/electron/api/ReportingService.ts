import { EverythingService } from '../EverythingService.js'
import { Application } from '@feathersjs/feathers'
import EventEmitter from 'node:events'
import { ServiceTypes } from '../../ipc/IPCAPI.js'
import { LogLevel } from '@shared/api'

export class ReportingService extends EventEmitter {
	constructor(
		private app: Application<ServiceTypes, any>,
		private everythingService: EverythingService
	) {
		super()
	}

	async log(data: { level: LogLevel; params: any[] }): Promise<void> {
		// TODO: access control ??
		// TODO: throttle ??
		await this.everythingService.log(data)
	}

	async handleClientError(data: { error: string; stack?: string }): Promise<void> {
		// TODO: access control ??
		// TODO: throttle ??
		await this.everythingService.handleClientError(data)
	}

	async debugThrowError(data: { type: 'sync' | 'async' | 'setTimeout' }): Promise<void> {
		// TODO: access control ??
		await this.everythingService.debugThrowError(data)
	}

	async acknowledgeSeenVersion(): Promise<void> {
		await this.everythingService.acknowledgeSeenVersion()
	}

	async acknowledgeUserAgreement(data: { agreementVersion: string }): Promise<void> {
		await this.everythingService.acknowledgeUserAgreement(data)
	}
}
