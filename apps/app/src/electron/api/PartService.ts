import { EverythingService } from '../EverythingService'
import { Application } from '@feathersjs/feathers'
import EventEmitter from 'node:events'
import { GeneralError } from '@feathersjs/errors'
import { RundownTrigger } from '../../models/rundown/Trigger'
import { ClientEventBus } from '../ClientEventBus'
import { ResourceAny } from '@shared/models'
import { MoveTarget } from '../../lib/util'
import { Part } from '../../models/rundown/Part'
import { ServiceTypes } from '../../ipc/IPCAPI'

export class PartService extends EventEmitter {
	constructor(
		private app: Application<ServiceTypes, any>,
		private everythingService: EverythingService,
		_clientEventBus: ClientEventBus
	) {
		super()
	}

	async play(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		await this.everythingService.playPart(data)
	}

	async pause(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		await this.everythingService.pausePart(data)
	}

	async stop(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		await this.everythingService.stopPart(data)
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

	async create(data: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null

		name: string
	}): Promise<{ partId: string; groupId?: string }> {
		// TODO: access control
		const result = await this.everythingService.newPart(data)
		if (!result?.result) throw new GeneralError()
		return result.result
	}

	async insert(data: {
		rundownId: string
		groupId: string | null
		parts: { part: Part; resources: ResourceAny[] }[]
		target: MoveTarget
	}): Promise<
		{
			groupId: string
			partId: string
		}[]
	> {
		// TODO: access control
		const result = await this.everythingService.insertParts(data)
		if (!result?.result) throw new GeneralError()
		return result.result
	}

	async update(data: { rundownId: string; groupId: string; partId: string; part: Partial<Part> }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.updatePart(data)
		if (!result) throw new GeneralError()
	}

	async remove(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.deletePart(data)
		if (!result) throw new GeneralError()
	}

	async move(data: {
		parts: { rundownId: string; partId: string }[]
		to: { rundownId: string; groupId: string | null; target: MoveTarget }
	}): Promise<{ partId: string; groupId: string; rundownId: string }[]> {
		// TODO: access control
		const result = await this.everythingService.moveParts(data)
		if (!result?.result) throw new GeneralError()
		return result.result
	}

	async duplicate(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.duplicatePart(data)
		if (!result) throw new GeneralError()
	}
}
