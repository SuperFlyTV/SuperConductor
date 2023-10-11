import { EverythingService } from '../EverythingService'
import { Application, Params } from '@feathersjs/feathers'
import { Rundown } from '../../models/rundown/Rundown'
import EventEmitter from 'node:events'
import { GeneralError, NotFound } from '@feathersjs/errors'
import { ServiceTypes } from '../../ipc/IPCAPI'
import { RundownTrigger } from '../../models/rundown/Trigger'
import { PartialDeep } from 'type-fest/source/partial-deep'
import { TimelineObj } from '../../models/rundown/TimelineObj'
import { ClientEventBus } from '../ClientEventBus'
import { ResourceAny, ResourceId } from '@shared/models'
import { MoveTarget } from '../../lib/util'

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
			this.emit('updated', rundown)
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

	async setPartTrigger(data: {
		rundownId: string
		groupId: string
		partId: string
		trigger: RundownTrigger | null
		triggerIndex: number | null
	}): Promise<void> {
		// TODO: access control
		await this.everythingService.setPartTrigger(data)
	}

	// async stopGroup(data: GroupData): Promise<void> {
	// 	// TODO: access control
	// 	await this.everythingService.stopGroup(data)
	// }

	// async playGroup(data: GroupData): Promise<void> {
	// 	// TODO: access control
	// 	await this.everythingService.playGroup(data)
	// }

	// async pauseGroup(data: GroupData): Promise<void> {
	// 	// TODO: access control
	// 	await this.everythingService.pauseGroup(data)
	// }

	// async playNext(data: GroupData): Promise<void> {
	// 	// TODO: access control
	// 	await this.everythingService.playNext(data)
	// }

	// async playPrev(data: GroupData): Promise<void> {
	// 	// TODO: access control
	// 	await this.everythingService.playPrev(data)
	// }

	async deleteTimelineObj(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.deleteTimelineObj(data)
		if (!result) throw new GeneralError()
	}

	async insertTimelineObjs(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjs: TimelineObj[]
		target: MoveTarget | null
	}): Promise<
		{
			groupId: string
			partId: string
			timelineObjId: string
		}[]
	> {
		// TODO: access control
		const result = await this.everythingService.insertTimelineObjs(data)
		if (!result?.result) throw new GeneralError()
		return result.result
	}

	async addResourcesToTimeline(data: {
		rundownId: string
		groupId: string
		partId: string

		layerId: string | null
		resourceIds: (ResourceId | ResourceAny)[]
	}): Promise<void> {
		// TODO: access control
		await this.everythingService.addResourcesToTimeline(data)
	}

	async updateTimelineObj(data: TimelineObjectUpdate): Promise<void> {
		// TODO: access control
		await this.everythingService.updateTimelineObj(data)
	}

	async moveTimelineObjToNewLayer(data: TimelineObjectMove): Promise<void> {
		// TODO: access control
		await this.everythingService.moveTimelineObjToNewLayer(data)
	}

	// async newPart(data: {
	// 	rundownId: string
	// 	/** The group to create the part into. If null; will create a "transparent group" */
	// 	groupId: string | null

	// 	name: string
	// }): Promise<{ partId: string; groupId?: string }> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.newPart(data)
	// 	if (!result?.result) throw new GeneralError()
	// 	return result.result
	// }

	// async insertParts(data: {
	// 	rundownId: string
	// 	groupId: string | null
	// 	parts: { part: Part; resources: ResourceAny[] }[]
	// 	target: MoveTarget
	// }): Promise<
	// 	{
	// 		groupId: string
	// 		partId: string
	// 	}[]
	// > {
	// 	// TODO: access control
	// 	const result = await this.everythingService.insertParts(data)
	// 	if (!result?.result) throw new GeneralError()
	// 	return result.result
	// }

	// async updatePart(data: { rundownId: string; groupId: string; partId: string; part: Partial<Part> }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.updatePart(data)
	// 	if (!result) throw new GeneralError()
	// }

	// async newGroup(data: { rundownId: string; name: string }): Promise<string> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.newGroup(data)
	// 	if (!result?.result) throw new GeneralError()
	// 	return result.result
	// }

	// async insertGroups(data: {
	// 	rundownId: string
	// 	groups: {
	// 		group: Group
	// 		resources: {
	// 			[partId: string]: ResourceAny[]
	// 		}
	// 	}[]
	// 	target: MoveTarget
	// }): Promise<
	// 	{
	// 		groupId: string
	// 	}[]
	// > {
	// 	// TODO: access control
	// 	const result = await this.everythingService.insertGroups(data)
	// 	if (!result?.result) throw new GeneralError()
	// 	return result.result
	// }

	// async updateGroup(data: { rundownId: string; groupId: string; group: PartialDeep<Group> }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.updateGroup(data)
	// 	if (!result) throw new GeneralError()
	// }

	// async deletePart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.deletePart(data)
	// 	if (!result) throw new GeneralError()
	// }

	// async deleteGroup(data: { rundownId: string; groupId: string }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.deleteGroup(data)
	// 	if (!result) throw new GeneralError()
	// }

	// async moveParts(data: {
	// 	parts: { rundownId: string; partId: string }[]
	// 	to: { rundownId: string; groupId: string | null; target: MoveTarget }
	// }): Promise<{ partId: string; groupId: string; rundownId: string }[]> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.moveParts(data)
	// 	if (!result?.result) throw new GeneralError()
	// 	return result.result
	// }

	// async duplicatePart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.duplicatePart(data)
	// 	if (!result) throw new GeneralError()
	// }

	// async moveGroups(data: { rundownId: string; groupIds: string[]; target: MoveTarget }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.moveGroups(data)
	// 	if (!result) throw new GeneralError()
	// }

	// async duplicateGroup(data: { rundownId: string; groupId: string }): Promise<void> {
	// 	// TODO: access control
	// 	const result = await this.everythingService.duplicateGroup(data)
	// 	if (!result) throw new GeneralError()
	// }
}
