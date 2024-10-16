import { EverythingService } from '../EverythingService.js'
import { LoggerLike } from '@shared/api'

import { HookContext, feathers } from '@feathersjs/feathers'
import { koa, rest, bodyParser, errorHandler, serveStatic, cors } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { Rundown } from '../../models/rundown/Rundown.js'
import { ClientEventBus } from '../ClientEventBus.js'
import { RundownService, RUNDOWN_CHANNEL_PREFIX } from './RundownService.js'
import { LegacyService } from './LegacyService.js'
import { ReportingService } from './ReportingService.js'
import { PROJECTS_CHANNEL_PREFIX, ProjectService } from './ProjectService.js'
import { ClientMethods, ProjectsEvents, RundownsEvents, ServiceName, ServiceTypes } from '../../ipc/IPCAPI.js'
import { Project, ProjectBase } from '../../models/project/Project.js'
import { PartService } from './PartService.js'
import { GroupService } from './GroupService.js'
import { unReplaceUndefined } from '../../lib/util.js'

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

		this.app.use(ServiceName.GROUPS, new GroupService(this.app, ipcServer, clientEventBus), {
			methods: ClientMethods[ServiceName.GROUPS],
			serviceEvents: [],
			events: [],
		})

		this.app.use(ServiceName.PROJECTS, new ProjectService(this.app, ipcServer, clientEventBus), {
			methods: ClientMethods[ServiceName.PROJECTS],
			serviceEvents: ['created', ProjectsEvents.UPDATED, 'deleted', ProjectsEvents.UNDO_LEDGERS_UPDATED],
		})

		this.app.use(ServiceName.PARTS, new PartService(this.app, ipcServer, clientEventBus), {
			methods: ClientMethods[ServiceName.PARTS],
			serviceEvents: [],
			events: [],
		})

		this.app.use(ServiceName.RUNDOWNS, new RundownService(this.app, ipcServer, clientEventBus), {
			// TODO: what if we made a base class for Services and made those arrays fields so that they live nearvy the implementation?
			methods: ClientMethods[ServiceName.RUNDOWNS],
			serviceEvents: ['created', RundownsEvents.UPDATED, 'deleted'],
		})

		this.app.use(ServiceName.REPORTING, new ReportingService(this.app, ipcServer), {
			methods: ClientMethods[ServiceName.REPORTING],
			serviceEvents: [],
			events: [],
		})

		// TODO: potentially may break some thing in ultra rare cases. Should we enable it only for selected methods?
		this.app.hooks({
			before: {
				all: [
					async (context: HookContext) => {
						context.data = unReplaceUndefined(context.data)
					},
				],
			},
		})

		this.app.service(ServiceName.RUNDOWNS).publish((data: Rundown, _context: HookContext) => {
			return this.app.channel(RUNDOWN_CHANNEL_PREFIX + data.id)
		})

		this.app
			.service(ServiceName.PROJECTS)
			.publish((_data: string | Project | ProjectBase, _context: HookContext) => {
				return this.app.channel(PROJECTS_CHANNEL_PREFIX)
			})

		// --- legacy code, only for a rapid prototype
		this.app.use(
			ServiceName.LEGACY,
			new LegacyService(this.app, ipcServer, clientEventBus) as unknown as EverythingService,
			{
				methods: Object.getOwnPropertyNames(EverythingService.prototype).filter(
					(methodName) => !methodName.startsWith('_') && methodName !== 'constructor'
				) as (keyof EverythingService)[],
				events: ['callMethod'],
			}
		)
		this.app.on('connection', (connection) => {
			this.app.channel('everybody').join(connection)
			this.app.channel(PROJECTS_CHANNEL_PREFIX).join(connection) // TODO: use ids and remove this
		})
		this.app.service(ServiceName.LEGACY).publish(() => {
			return this.app.channel(`everybody`)
		})
		// ---- end legacy code

		this.app
			.listen(port, '127.0.0.1')
			.then(() => log.info('Feathers server listening on 127.0.0.1:' + port))
			.catch(log.error)
	}
}
