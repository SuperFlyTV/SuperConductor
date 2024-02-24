import { EverythingService } from '../EverythingService'
import { Application } from '@feathersjs/feathers'
import EventEmitter from 'node:events'
import { GeneralError } from '@feathersjs/errors'
import { PartialDeep } from 'type-fest/source/partial-deep'
import { ClientEventBus } from '../ClientEventBus'
import { ResourceAny } from '@shared/models'
import { MoveTarget } from '../../lib/util'
import { Group, GroupViewMode } from '../../models/rundown/Group'
import { ServiceTypes } from '../../ipc/IPCAPI'

interface GroupData {
	rundownId: string
	groupId: string
}

export class GroupService extends EventEmitter {
	constructor(
		private app: Application<ServiceTypes, any>,
		private everythingService: EverythingService,
		_clientEventBus: ClientEventBus
	) {
		super()
	}

	async play(data: GroupData): Promise<void> {
		// TODO: access control
		await this.everythingService.playGroup(data)
	}

	async pause(data: GroupData): Promise<void> {
		// TODO: access control
		await this.everythingService.pauseGroup(data)
	}

	async stop(data: GroupData): Promise<void> {
		// TODO: access control
		await this.everythingService.stopGroup(data)
	}
	async playNext(data: GroupData): Promise<void> {
		// TODO: access control
		await this.everythingService.playNext(data)
	}
	async playPrev(data: GroupData): Promise<void> {
		// TODO: access control
		await this.everythingService.playPrev(data)
	}

	async create(data: { rundownId: string; name: string }): Promise<string> {
		// TODO: access control
		const result = await this.everythingService.newGroup(data)
		if (!result?.result) throw new GeneralError()
		return result.result
	}

	async insert(data: {
		rundownId: string
		groups: {
			group: Group
			resources: {
				[partId: string]: ResourceAny[]
			}
		}[]
		target: MoveTarget
	}): Promise<
		{
			groupId: string
		}[]
	> {
		// TODO: access control
		const result = await this.everythingService.insertGroups(data)
		if (!result?.result) throw new GeneralError()
		return result.result
	}

	async update(data: { rundownId: string; groupId: string; group: PartialDeep<Group> }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.updateGroup(data)
		if (!result) throw new GeneralError()
	}

	async remove(data: { rundownId: string; groupId: string }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.deleteGroup(data)
		if (!result) throw new GeneralError()
	}

	async move(data: { rundownId: string; groupIds: string[]; target: MoveTarget }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.moveGroups(data)
		if (!result) throw new GeneralError()
	}

	async duplicate(data: { rundownId: string; groupId: string }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.duplicateGroup(data)
		if (!result) throw new GeneralError()
	}

	async setViewMode(data: { rundownId: string; groupId: string; viewMode: GroupViewMode }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.setGroupViewMode({
			rundownId: data.rundownId,
			groupId: data.groupId,
			viewMode: data.viewMode,
		})
		if (!result) throw new GeneralError()
	}
	async setAllViewMode(data: { rundownId: string; viewMode: GroupViewMode }): Promise<void> {
		// TODO: access control
		const result = await this.everythingService.setAllGroupsViewMode({
			rundownId: data.rundownId,
			viewMode: data.viewMode,
		})
		if (!result) throw new GeneralError()
	}
}
