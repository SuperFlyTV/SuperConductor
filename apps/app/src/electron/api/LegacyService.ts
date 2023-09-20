import { EverythingService } from '../IPCServer'
import { Application } from '@feathersjs/feathers'
import { ClientEventBus } from '../ClientEventBus'
import EventEmitter from 'node:events'
import { ServiceTypes } from './ApiServer'

// --- this is only for a rapid prototype, exposing ALL the IPC over WebSocket
export class LegacyService extends EventEmitter {
	constructor(private app: Application<ServiceTypes, any>, ipcServer: EverythingService, ipcClient: ClientEventBus) {
		super()
		for (const methodName of Object.getOwnPropertyNames(EverythingService.prototype)) {
			// Ignore "private" methods.
			if (methodName.startsWith('_')) continue
			if (methodName === 'constructor') continue

			const originalMethod = (ipcServer as any)[methodName]
			// Ignore methods that don't exist.
			if (!originalMethod) continue
			const fcn = originalMethod.bind(ipcServer)
			;(this as any)[methodName] = (data: any) => {
				console.log('Received', methodName, data)
				return fcn(...data)
			}
		}
		ipcClient.on('callMethod', (...args) => this.emit('callMethod', args))
	}
}
