import { ClientMethods, IPCServerMethods, ServiceName, ServiceTypes } from '../../ipc/IPCAPI'
import { replaceUndefined } from '../../lib/util'

import { HookContext, feathers } from '@feathersjs/feathers'
import socketio, { SocketService } from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import { Rundown } from '../../models/rundown/Rundown'
import { Project } from '../../models/project/Project'

type AddTypeToProperties<T, U> = {
	[K in keyof T]: U & T[K]
}

const socket = io('127.0.0.1:5500') // TODO
export const app = feathers<AddTypeToProperties<ServiceTypes, SocketService>>()
const socketClient = socketio(socket)
app.configure(socketClient)

type GroupArg<T extends keyof ServiceTypes[ServiceName.GROUPS]> = Parameters<ServiceTypes[ServiceName.GROUPS][T]>[0]
type PartArg<T extends keyof ServiceTypes[ServiceName.PARTS]> = Parameters<ServiceTypes[ServiceName.PARTS][T]>[0]
type RundownArg<T extends keyof ServiceTypes[ServiceName.RUNDOWNS]> = Parameters<
	ServiceTypes[ServiceName.RUNDOWNS][T]
>[0]
type ProjectArg<T extends keyof ServiceTypes[ServiceName.PROJECTS]> = Parameters<
	ServiceTypes[ServiceName.PROJECTS][T]
>[0]
type ReportingArg<T extends keyof ServiceTypes[ServiceName.REPORTING]> = Parameters<
	ServiceTypes[ServiceName.REPORTING][T]
>[0]

// TODO this type assertion below should be unnecessary
app.use(
	ServiceName.GROUPS,
	socketClient.service(ServiceName.GROUPS) as SocketService & ServiceTypes[ServiceName.GROUPS],
	{
		methods: ClientMethods[ServiceName.GROUPS],
	}
)
app.use(ServiceName.PARTS, socketClient.service(ServiceName.PARTS) as SocketService & ServiceTypes[ServiceName.PARTS], {
	methods: ClientMethods[ServiceName.PARTS],
})
app.use(
	ServiceName.PROJECTS,
	socketClient.service(ServiceName.PROJECTS) as SocketService & ServiceTypes[ServiceName.PROJECTS],
	{
		methods: ClientMethods[ServiceName.PROJECTS],
	}
)
app.use(
	ServiceName.RUNDOWNS,
	socketClient.service(ServiceName.RUNDOWNS) as SocketService & ServiceTypes[ServiceName.RUNDOWNS],
	{
		methods: ClientMethods[ServiceName.RUNDOWNS],
	}
)
app.use(
	ServiceName.REPORTING,
	socketClient.service(ServiceName.REPORTING) as SocketService & ServiceTypes[ServiceName.REPORTING],
	{
		methods: ClientMethods[ServiceName.REPORTING],
	}
)

app.hooks({
	before: {
		all: [
			async (context: HookContext) => {
				context.data = replaceUndefined(context.data)
			},
		],
	},
})

type ServerArgs<T extends keyof IPCServerMethods> = Parameters<IPCServerMethods[T]>
type ServerReturn<T extends keyof IPCServerMethods> = Promise<ReturnType<IPCServerMethods[T]>>

/** This class is used client-side, to send requests to the server */
export class ApiClient {
	private readonly groupService = app.service(ServiceName.GROUPS)
	private readonly partService = app.service(ServiceName.PARTS)
	private readonly projectService = app.service(ServiceName.PROJECTS)
	private readonly reportingService = app.service(ServiceName.REPORTING)
	private readonly rundownService = app.service(ServiceName.RUNDOWNS) // TODO: DI?

	/**
	 * @deprecated legacy code
	 */
	private async invokeServerMethod<T extends keyof IPCServerMethods>(methodname: T, ...args: any[]): ServerReturn<T> {
		// Stringifying and parsing data will convert Mobx observable objects into object literals.
		// Otherwise, Electron won't be able to clone it.
		return new Promise((resolve, reject) => {
			socket.emit(methodname, ServiceName.LEGACY, [...replaceUndefined(args)], {}, (error: any, data: any) => {
				if (error) {
					reject(error)
				} else {
					console.log('Called ', methodname, 'received', data)
					resolve(data)
				}
			})
		}) as ServerReturn<T>
	}
	// --- legacy code end

	async log(data: ReportingArg<'log'>): Promise<void> {
		await this.reportingService.log(data)
	}
	async handleClientError(data: ReportingArg<'handleClientError'>): Promise<void> {
		await this.reportingService.handleClientError(data)
	}
	async debugThrowError(data: ReportingArg<'debugThrowError'>): Promise<void> {
		await this.reportingService.debugThrowError(data)
	}
	async installUpdate(...args: ServerArgs<'installUpdate'>): ServerReturn<'installUpdate'> {
		return this.invokeServerMethod('installUpdate', ...args)
	}
	async triggerSendAll(...args: ServerArgs<'triggerSendAll'>): ServerReturn<'triggerSendAll'> {
		return this.invokeServerMethod('triggerSendAll', ...args)
	}

	async getRundown(rundownId: string): Promise<Rundown> {
		return await this.rundownService.get(rundownId)
	}

	async unsubscribe(rundownId: RundownArg<'unsubscribe'>): Promise<void> {
		return await this.rundownService.unsubscribe(rundownId, {}) // TODO: this second param should be unnecessary
	}

	async setKeyboardKeys(...args: ServerArgs<'setKeyboardKeys'>): ServerReturn<'setKeyboardKeys'> {
		return this.invokeServerMethod('setKeyboardKeys', ...args)
	}
	async makeDevData(...args: ServerArgs<'makeDevData'>): ServerReturn<'makeDevData'> {
		return this.invokeServerMethod('makeDevData', ...args)
	}

	async acknowledgeSeenVersion(): ServerReturn<'acknowledgeSeenVersion'> {
		await this.reportingService.acknowledgeSeenVersion()
	}
	async acknowledgeUserAgreement(
		data: ReportingArg<'acknowledgeUserAgreement'>
	): ServerReturn<'acknowledgeUserAgreement'> {
		await this.reportingService.acknowledgeUserAgreement(data)
	}
	async fetchGDDCache(...args: ServerArgs<'fetchGDDCache'>): ServerReturn<'fetchGDDCache'> {
		return this.invokeServerMethod('fetchGDDCache', ...args)
	}
	async storeGDDCache(...args: ServerArgs<'storeGDDCache'>): ServerReturn<'storeGDDCache'> {
		return this.invokeServerMethod('storeGDDCache', ...args)
	}
	async updateGUISelection(...args: ServerArgs<'updateGUISelection'>): ServerReturn<'updateGUISelection'> {
		return this.invokeServerMethod('updateGUISelection', ...args)
	}
	async exportProject(): ServerReturn<'exportProject'> {
		await this.projectService.export()
	}
	async importProject(): ServerReturn<'importProject'> {
		await this.projectService.import()
	}
	async newProject(): ServerReturn<'newProject'> {
		return await this.projectService.create()
	}
	async listProjects(): ServerReturn<'listProjects'> {
		return await this.projectService.getAll({})
	}
	async openProject(...args: ServerArgs<'openProject'>): ServerReturn<'openProject'> {
		await this.projectService.open(...args)
	}
	async playPart(data: PartArg<'play'>): Promise<void> {
		return await this.partService.play(data)
	}
	async pausePart(data: PartArg<'pause'>): Promise<void> {
		return await this.partService.pause(data)
	}
	async stopPart(data: PartArg<'stop'>): Promise<void> {
		return await this.partService.stop(data)
	}
	async setPartTrigger(data: PartArg<'setPartTrigger'>): Promise<void> {
		return await this.partService.setPartTrigger(data)
	}
	async stopGroup(data: GroupArg<'stop'>): Promise<void> {
		return await this.groupService.stop(data)
	}
	async playGroup(data: GroupArg<'play'>): Promise<void> {
		return await this.groupService.play(data)
	}
	async pauseGroup(data: GroupArg<'pause'>): Promise<void> {
		return await this.groupService.pause(data)
	}
	async playNext(data: GroupArg<'playNext'>): Promise<void> {
		return await this.groupService.playNext(data)
	}
	async playPrev(data: GroupArg<'playPrev'>): Promise<void> {
		return await this.groupService.playPrev(data)
	}
	async updateTimelineObj(data: RundownArg<'updateTimelineObj'>): Promise<void> {
		return await this.rundownService.updateTimelineObj(data)
	}
	async moveTimelineObjToNewLayer(data: RundownArg<'moveTimelineObjToNewLayer'>): Promise<void> {
		return await this.rundownService.moveTimelineObjToNewLayer(data)
	}
	/**
	 * @returns An object containing the ID of the new part and, conditionally, the ID of the new group (if one was created).
	 */
	async newPart(data: PartArg<'create'>): ServerReturn<'newPart'> {
		return await this.partService.create(data)
	}
	async insertParts(data: PartArg<'insert'>): ServerReturn<'insertParts'> {
		return await this.partService.insert(data)
	}
	async updatePart(data: PartArg<'update'>): ServerReturn<'updatePart'> {
		return await this.partService.update(data)
	}
	async newGroup(data: GroupArg<'create'>): ServerReturn<'newGroup'> {
		return await this.groupService.create(data)
	}
	async insertGroups(data: GroupArg<'insert'>): ServerReturn<'insertGroups'> {
		return await this.groupService.insert(data)
	}
	async updateGroup(data: GroupArg<'update'>): ServerReturn<'updateGroup'> {
		return await this.groupService.update(data)
	}
	async deletePart(data: PartArg<'remove'>): ServerReturn<'deletePart'> {
		return await this.partService.remove(data)
	}
	async deleteGroup(data: GroupArg<'remove'>): ServerReturn<'deleteGroup'> {
		return await this.groupService.remove(data)
	}
	async moveParts(data: PartArg<'move'>): ServerReturn<'moveParts'> {
		return await this.partService.move(data)
	}
	async duplicatePart(data: PartArg<'duplicate'>): ServerReturn<'duplicatePart'> {
		return await this.partService.duplicate(data)
	}
	async moveGroups(data: GroupArg<'move'>): ServerReturn<'moveGroups'> {
		return await this.groupService.move(data)
	}
	async duplicateGroup(data: GroupArg<'duplicate'>): ServerReturn<'duplicateGroup'> {
		return await this.groupService.duplicate(data)
	}
	async deleteTimelineObj(data: PartArg<'deleteTimelineObj'>): ServerReturn<'deleteTimelineObj'> {
		return await this.partService.deleteTimelineObj(data)
	}
	async insertTimelineObjs(data: PartArg<'insertTimelineObjs'>): ServerReturn<'insertTimelineObjs'> {
		return await this.partService.insertTimelineObjs(data)
	}
	async addResourcesToTimeline(data: PartArg<'addResourcesToTimeline'>): ServerReturn<'addResourcesToTimeline'> {
		return await this.partService.addResourcesToTimeline(data)
	}
	async toggleGroupLoop(...args: ServerArgs<'toggleGroupLoop'>): ServerReturn<'toggleGroupLoop'> {
		return this.invokeServerMethod('toggleGroupLoop', ...args)
	}
	async toggleGroupAutoplay(...args: ServerArgs<'toggleGroupAutoplay'>): ServerReturn<'toggleGroupAutoplay'> {
		return this.invokeServerMethod('toggleGroupAutoplay', ...args)
	}
	async toggleGroupOneAtATime(...args: ServerArgs<'toggleGroupOneAtATime'>): ServerReturn<'toggleGroupOneAtATime'> {
		return this.invokeServerMethod('toggleGroupOneAtATime', ...args)
	}
	async toggleGroupDisable(...args: ServerArgs<'toggleGroupDisable'>): ServerReturn<'toggleGroupDisable'> {
		return this.invokeServerMethod('toggleGroupDisable', ...args)
	}
	async toggleGroupLock(...args: ServerArgs<'toggleGroupLock'>): ServerReturn<'toggleGroupLock'> {
		return this.invokeServerMethod('toggleGroupLock', ...args)
	}
	async toggleGroupCollapse(...args: ServerArgs<'toggleGroupCollapse'>): ServerReturn<'toggleGroupCollapse'> {
		return this.invokeServerMethod('toggleGroupCollapse', ...args)
	}
	async toggleAllGroupsCollapse(
		...args: ServerArgs<'toggleAllGroupsCollapse'>
	): ServerReturn<'toggleAllGroupsCollapse'> {
		return this.invokeServerMethod('toggleAllGroupsCollapse', ...args)
	}
	async refreshResources(...args: ServerArgs<'refreshResources'>): ServerReturn<'refreshResources'> {
		return this.invokeServerMethod('refreshResources', ...args)
	}
	async refreshResourcesSetAuto(
		...args: ServerArgs<'refreshResourcesSetAuto'>
	): ServerReturn<'refreshResourcesSetAuto'> {
		return this.invokeServerMethod('refreshResourcesSetAuto', ...args)
	}
	async triggerHandleAutoFill(...args: ServerArgs<'triggerHandleAutoFill'>): ServerReturn<'triggerHandleAutoFill'> {
		return this.invokeServerMethod('triggerHandleAutoFill', ...args)
	}
	async updateAppData(...args: ServerArgs<'updateAppData'>): ServerReturn<'updateAppData'> {
		return this.invokeServerMethod('updateAppData', ...args)
	}
	async updateProject(data: { id: string; project: Project }): ServerReturn<'updateProject'> {
		return await this.projectService.update(data.id, data.project)
	}
	async newRundown(...args: ServerArgs<'newRundown'>): ServerReturn<'newRundown'> {
		return await this.rundownService.create(...args)
	}
	async deleteRundown(data: RundownArg<'remove'>): ServerReturn<'deleteRundown'> {
		await this.rundownService.remove(data)
	}
	async openRundown(data: RundownArg<'open'>): ServerReturn<'openRundown'> {
		await this.rundownService.open(data)
	}
	async closeRundown(data: RundownArg<'open'>): ServerReturn<'closeRundown'> {
		await this.rundownService.close(data)
	}
	async renameRundown(data: RundownArg<'rename'>): ServerReturn<'renameRundown'> {
		return await this.rundownService.rename(data)
	}
	async isRundownPlaying(data: RundownArg<'isPlaying'>): ServerReturn<'isRundownPlaying'> {
		return await this.rundownService.isPlaying(data)
	}
	async createMissingMapping(...args: ServerArgs<'createMissingMapping'>): ServerReturn<'createMissingMapping'> {
		return this.invokeServerMethod('createMissingMapping', ...args)
	}
	async isTimelineObjPlaying(...args: ServerArgs<'isTimelineObjPlaying'>): ServerReturn<'isTimelineObjPlaying'> {
		return this.invokeServerMethod('isTimelineObjPlaying', ...args)
	}
	async addPeripheralArea(...args: ServerArgs<'addPeripheralArea'>): ServerReturn<'addPeripheralArea'> {
		return this.invokeServerMethod('addPeripheralArea', ...args)
	}
	async removePeripheralArea(...args: ServerArgs<'removePeripheralArea'>): ServerReturn<'removePeripheralArea'> {
		return this.invokeServerMethod('removePeripheralArea', ...args)
	}
	async updatePeripheralArea(...args: ServerArgs<'updatePeripheralArea'>): ServerReturn<'updatePeripheralArea'> {
		return this.invokeServerMethod('updatePeripheralArea', ...args)
	}
	async assignAreaToGroup(...args: ServerArgs<'assignAreaToGroup'>): ServerReturn<'assignAreaToGroup'> {
		return this.invokeServerMethod('assignAreaToGroup', ...args)
	}
	async startDefiningArea(...args: ServerArgs<'startDefiningArea'>): ServerReturn<'startDefiningArea'> {
		return this.invokeServerMethod('startDefiningArea', ...args)
	}
	async finishDefiningArea(...args: ServerArgs<'finishDefiningArea'>): ServerReturn<'finishDefiningArea'> {
		return this.invokeServerMethod('finishDefiningArea', ...args)
	}
	async setApplicationTrigger(...args: ServerArgs<'setApplicationTrigger'>): ServerReturn<'setApplicationTrigger'> {
		return this.invokeServerMethod('setApplicationTrigger', ...args)
	}
	async undo(data: ProjectArg<'undo'>): Promise<void> {
		return this.projectService.undo(data)
	}
	async redo(data: ProjectArg<'redo'>): Promise<void> {
		return this.projectService.redo(data)
	}
}
