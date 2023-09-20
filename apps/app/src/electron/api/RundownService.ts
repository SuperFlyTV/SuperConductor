import { EverythingService } from '../EverythingService'
import { Application, Params } from '@feathersjs/feathers'
import { Rundown } from '../../models/rundown/Rundown'
import EventEmitter from 'node:events'
import { GeneralError, NotFound } from '@feathersjs/errors'
import { ServiceTypes } from './ApiServer'

export const RUNDOWN_CHANNEL_PREFIX = 'rundowns/'
export class RundownService extends EventEmitter {
	constructor(private app: Application<ServiceTypes, any>, private everythingService: EverythingService) {
		super()
	}

	async get(id: string, params: Params): Promise<Rundown> {
		// TODO: access control
		const rundown = this.everythingService.getRundown({ rundownId: id })
		if (!rundown) throw new NotFound()
		if (rundown && params.connection) {
			this.app.channel(RUNDOWN_CHANNEL_PREFIX + id).join(params.connection) // automatically subscribes to updates
		}
		return rundown.rundown
	}

	async unsubscribe(id: string, params: Params): Promise<void> {
		if (params.connection) {
			this.app.channel(RUNDOWN_CHANNEL_PREFIX + id).leave(params.connection)
		}
	}

	async create(data: { name: string }): Promise<Rundown> {
		// TODO: access control
		const result = await this.everythingService.newRundown(data)
		if (!result.result) throw new GeneralError()
		return result.result
	}

	// this could potentially be moved to a PartService or GroupService
	async playPart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		const rundown = await this.everythingService.playPart(data)
		this.emit('updated', rundown) // TODO: make this more granular
	}

	// this too could potentially be moved to a PartService or GroupService
	async pausePart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		const rundown = await this.everythingService.pausePart(data)
		this.emit('updated', rundown) // TODO: make this more granular
	}

	// this too could potentially be moved to a PartService or GroupService
	async stopPart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		const rundown = await this.everythingService.stopPart(data)
		this.emit('updated', rundown) // TODO: make this more granular
	}
}
