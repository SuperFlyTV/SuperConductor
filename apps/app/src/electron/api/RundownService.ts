import { EverythingService } from '../EverythingService'
import { Application, Params } from '@feathersjs/feathers'
import { Rundown } from '../../models/rundown/Rundown'
import EventEmitter from 'node:events'
import { GeneralError, NotFound } from '@feathersjs/errors'
import { RundownsEvents, ServiceTypes } from '../../ipc/IPCAPI'
import { PartialDeep } from 'type-fest/source/partial-deep'
import { TimelineObj } from '../../models/rundown/TimelineObj'
import { ClientEventBus } from '../ClientEventBus'

export const RUNDOWN_CHANNEL_PREFIX = 'rundowns/'
interface TimelineObjectUpdate {
	rundownId: string
	groupId: string
	partId: string
	timelineObjId: string
	timelineObj: {
		obj: PartialDeep<TimelineObj['obj']>
	}
}

interface TimelineObjectMove {
	rundownId: string
	groupId: string
	partId: string
	timelineObjId: string
}

export class RundownService extends EventEmitter {
	constructor(
		private app: Application<ServiceTypes, any>,
		private everythingService: EverythingService,
		clientEventBus: ClientEventBus
	) {
		super()
		clientEventBus.on('updateRundown', (rundown: Rundown) => {
			this.emit(RundownsEvents.UPDATED, rundown)
		})
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

	async remove(data: { rundownId: string }): Promise<Pick<Rundown, 'id'>> {
		// TODO: access control
		await this.everythingService.deleteRundown(data)
		return { id: data.rundownId }
	}

	async open(data: { rundownId: string }): Promise<void> {
		// TODO: access control
		await this.everythingService.openRundown(data)
	}

	async close(data: { rundownId: string }): Promise<void> {
		// TODO: access control
		await this.everythingService.closeRundown(data)
	}

	async rename(data: { rundownId: string; newName: string }): Promise<string> {
		// TODO: access control
		const result = await this.everythingService.renameRundown(data)
		if (!result.result) throw new GeneralError()
		return result.result
		// TODO: this needs to emit, I think
	}

	async isPlaying(data: { rundownId: string }): Promise<boolean> {
		// TODO: access control
		return await this.everythingService.isRundownPlaying(data)
	}

	async updateTimelineObj(data: TimelineObjectUpdate): Promise<void> {
		// TODO: access control
		await this.everythingService.updateTimelineObj(data)
	}

	async moveTimelineObjToNewLayer(data: TimelineObjectMove): Promise<void> {
		// TODO: access control
		await this.everythingService.moveTimelineObjToNewLayer(data)
	}
}
