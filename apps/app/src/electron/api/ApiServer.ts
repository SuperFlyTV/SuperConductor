import { EverythingService } from '../IPCServer'
import { LoggerLike } from '@shared/api'

import { HookContext, feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic, cors } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { Rundown } from '../../models/rundown/Rundown'
import { ClientEventBus } from '../ClientEventBus'
import { RundownService, RUNDOWN_CHANNEL_PREFIX } from './RundownService'
import { LegacyService } from './LegacyService'

// ---

export type ServiceTypes = {
	rundowns: RundownService
	legacy: EverythingService
}

export class ApiServer {
	private app = koa<ServiceTypes>(feathers())

	constructor(port: number, ipcServer: EverythingService, clientEventBus: ClientEventBus, log: LoggerLike) {
		this.app.use(serveStatic('src'))

		this.app.use(
			cors({
				origin: '*', // TODO: cors
			})
		)

		this.app.use(errorHandler())
		this.app.use(bodyParser())
		this.app.configure(rest())
		this.app.configure(socketio({ cors: { origin: '*' } })) // TODO: cors

		this.app.use('rundowns', new RundownService(this.app, ipcServer), {
			// TODO: what if we made a base class for Services and made those arrays fields so that they live nearvy the implementation?
			methods: ['get', 'create', 'unsubscribe', 'playPart', 'pausePart', 'stopPart'],
			serviceEvents: ['created', 'updated', 'deleted'],
		})

		this.app.service('rundowns').publish((data: Rundown, _context: HookContext) => {
			return this.app.channel(RUNDOWN_CHANNEL_PREFIX + data.id)
		})

		// --- legacy code, only for a rapid prototype
		this.app.use('legacy', new LegacyService(this.app, ipcServer, clientEventBus) as unknown as EverythingService, {
			methods: Object.getOwnPropertyNames(EverythingService.prototype).filter(
				(methodName) => !methodName.startsWith('_') && methodName !== 'constructor'
			) as (keyof EverythingService)[],
			events: ['callMethod'],
		})
		this.app.on('connection', (connection) => this.app.channel('everybody').join(connection))
		this.app.service('legacy').publish(() => {
			return this.app.channel(`everybody`)
		})
		// ---- end legacy code

		this.app
			.listen(port)
			.then(() => log.info('Feathers server listening on localhost:' + port))
			.catch(log.error)
	}
}
