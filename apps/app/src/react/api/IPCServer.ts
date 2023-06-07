import { IPCServerMethods } from '../../ipc/IPCAPI'
import { replaceUndefined } from '../../lib/util'

type Promisify<T> = {
	[K in keyof T]: T[K] extends (...arg: any[]) => any
		? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
		: T[K]
}

type ServerArgs<T extends keyof IPCServerMethods> = Parameters<IPCServerMethods[T]>
type ServerReturn<T extends keyof IPCServerMethods> = Promise<ReturnType<IPCServerMethods[T]>>

/** This class is used client-side, to send requests to the server */
export class IPCServer implements Promisify<IPCServerMethods> {
	constructor(private ipcRenderer: Electron.IpcRenderer) {}

	private async invokeServerMethod<T extends keyof IPCServerMethods>(methodname: T, ...args: any[]): ServerReturn<T> {
		// Stringifying and parsing data will convert Mobx observable objects into object literals.
		// Otherwise, Electron won't be able to clone it.
		return this.ipcRenderer.invoke(methodname, replaceUndefined(args))
	}

	async log(...args: ServerArgs<'log'>): ServerReturn<'log'> {
		return this.invokeServerMethod('log', ...args)
	}
	async handleClientError(...args: ServerArgs<'handleClientError'>): ServerReturn<'handleClientError'> {
		return this.invokeServerMethod('handleClientError', ...args)
	}
	async debugThrowError(...args: ServerArgs<'debugThrowError'>): ServerReturn<'debugThrowError'> {
		return this.invokeServerMethod('debugThrowError', ...args)
	}
	async installUpdate(...args: ServerArgs<'installUpdate'>): ServerReturn<'installUpdate'> {
		return this.invokeServerMethod('installUpdate', ...args)
	}
	async triggerSendAll(...args: ServerArgs<'triggerSendAll'>): ServerReturn<'triggerSendAll'> {
		return this.invokeServerMethod('triggerSendAll', ...args)
	}
	async triggerSendRundown(...args: ServerArgs<'triggerSendRundown'>): ServerReturn<'triggerSendRundown'> {
		return this.invokeServerMethod('triggerSendRundown', ...args)
	}

	async setKeyboardKeys(...args: ServerArgs<'setKeyboardKeys'>): ServerReturn<'setKeyboardKeys'> {
		return this.invokeServerMethod('setKeyboardKeys', ...args)
	}
	async makeDevData(...args: ServerArgs<'makeDevData'>): ServerReturn<'makeDevData'> {
		return this.invokeServerMethod('makeDevData', ...args)
	}

	async acknowledgeSeenVersion(
		...args: ServerArgs<'acknowledgeSeenVersion'>
	): ServerReturn<'acknowledgeSeenVersion'> {
		return this.invokeServerMethod('acknowledgeSeenVersion', ...args)
	}
	async acknowledgeUserAgreement(
		...args: ServerArgs<'acknowledgeUserAgreement'>
	): ServerReturn<'acknowledgeUserAgreement'> {
		return this.invokeServerMethod('acknowledgeUserAgreement', ...args)
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
	async exportProject(...args: ServerArgs<'exportProject'>): ServerReturn<'exportProject'> {
		return this.invokeServerMethod('exportProject', ...args)
	}
	async importProject(...args: ServerArgs<'importProject'>): ServerReturn<'importProject'> {
		return this.invokeServerMethod('importProject', ...args)
	}
	async newProject(...args: ServerArgs<'newProject'>): ServerReturn<'newProject'> {
		return this.invokeServerMethod('newProject', ...args)
	}
	async listProjects(...args: ServerArgs<'listProjects'>): ServerReturn<'listProjects'> {
		return this.invokeServerMethod('listProjects', ...args)
	}
	async openProject(...args: ServerArgs<'openProject'>): ServerReturn<'openProject'> {
		return this.invokeServerMethod('openProject', ...args)
	}
	async playPart(...args: ServerArgs<'playPart'>): ServerReturn<'playPart'> {
		return this.invokeServerMethod('playPart', ...args)
	}
	async pausePart(...args: ServerArgs<'pausePart'>): ServerReturn<'pausePart'> {
		return this.invokeServerMethod('pausePart', ...args)
	}
	async stopPart(...args: ServerArgs<'stopPart'>): ServerReturn<'stopPart'> {
		return this.invokeServerMethod('stopPart', ...args)
	}
	async setPartTrigger(...args: ServerArgs<'setPartTrigger'>): ServerReturn<'setPartTrigger'> {
		return this.invokeServerMethod('setPartTrigger', ...args)
	}
	async stopGroup(...args: ServerArgs<'stopGroup'>): ServerReturn<'stopGroup'> {
		return this.invokeServerMethod('stopGroup', ...args)
	}
	async playGroup(...args: ServerArgs<'playGroup'>): ServerReturn<'playGroup'> {
		return this.invokeServerMethod('playGroup', ...args)
	}
	async pauseGroup(...args: ServerArgs<'pauseGroup'>): ServerReturn<'pauseGroup'> {
		return this.invokeServerMethod('pauseGroup', ...args)
	}
	async playNext(...args: ServerArgs<'playNext'>): ServerReturn<'playNext'> {
		return this.invokeServerMethod('playNext', ...args)
	}
	async playPrev(...args: ServerArgs<'playPrev'>): ServerReturn<'playPrev'> {
		return this.invokeServerMethod('playPrev', ...args)
	}
	async updateTimelineObj(...args: ServerArgs<'updateTimelineObj'>): ServerReturn<'updateTimelineObj'> {
		return this.invokeServerMethod('updateTimelineObj', ...args)
	}
	async moveTimelineObjToNewLayer(
		...args: ServerArgs<'moveTimelineObjToNewLayer'>
	): ServerReturn<'moveTimelineObjToNewLayer'> {
		return this.invokeServerMethod('moveTimelineObjToNewLayer', ...args)
	}
	/**
	 * @returns An object containing the ID of the new part and, conditionally, the ID of the new group (if one was created).
	 */
	async newPart(...args: ServerArgs<'newPart'>): ServerReturn<'newPart'> {
		return this.invokeServerMethod('newPart', ...args)
	}
	async insertParts(...args: ServerArgs<'insertParts'>): ServerReturn<'insertParts'> {
		return this.invokeServerMethod('insertParts', ...args)
	}
	async updatePart(...args: ServerArgs<'updatePart'>): ServerReturn<'updatePart'> {
		return this.invokeServerMethod('updatePart', ...args)
	}
	async newGroup(...args: ServerArgs<'newGroup'>): ServerReturn<'newGroup'> {
		return this.invokeServerMethod('newGroup', ...args)
	}
	async insertGroups(...args: ServerArgs<'insertGroups'>): ServerReturn<'insertGroups'> {
		return this.invokeServerMethod('insertGroups', ...args)
	}
	async updateGroup(...args: ServerArgs<'updateGroup'>): ServerReturn<'updateGroup'> {
		return this.invokeServerMethod('updateGroup', ...args)
	}
	async deletePart(...args: ServerArgs<'deletePart'>): ServerReturn<'deletePart'> {
		return this.invokeServerMethod('deletePart', ...args)
	}
	async deleteGroup(...args: ServerArgs<'deleteGroup'>): ServerReturn<'deleteGroup'> {
		return this.invokeServerMethod('deleteGroup', ...args)
	}
	async moveParts(...args: ServerArgs<'moveParts'>): ServerReturn<'moveParts'> {
		return this.invokeServerMethod('moveParts', ...args)
	}
	async duplicatePart(...args: ServerArgs<'duplicatePart'>): ServerReturn<'duplicatePart'> {
		return this.invokeServerMethod('duplicatePart', ...args)
	}
	async moveGroups(...args: ServerArgs<'moveGroups'>): ServerReturn<'moveGroups'> {
		return this.invokeServerMethod('moveGroups', ...args)
	}
	async duplicateGroup(...args: ServerArgs<'duplicateGroup'>): ServerReturn<'duplicateGroup'> {
		return this.invokeServerMethod('duplicateGroup', ...args)
	}
	async deleteTimelineObj(...args: ServerArgs<'deleteTimelineObj'>): ServerReturn<'deleteTimelineObj'> {
		return this.invokeServerMethod('deleteTimelineObj', ...args)
	}
	async insertTimelineObjs(...args: ServerArgs<'insertTimelineObjs'>): ServerReturn<'insertTimelineObjs'> {
		return this.invokeServerMethod('insertTimelineObjs', ...args)
	}
	async addResourcesToTimeline(
		...args: ServerArgs<'addResourcesToTimeline'>
	): ServerReturn<'addResourcesToTimeline'> {
		return this.invokeServerMethod('addResourcesToTimeline', ...args)
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
	async updateProject(...args: ServerArgs<'updateProject'>): ServerReturn<'updateProject'> {
		return this.invokeServerMethod('updateProject', ...args)
	}
	async newRundown(...args: ServerArgs<'newRundown'>): ServerReturn<'newRundown'> {
		return this.invokeServerMethod('newRundown', ...args)
	}
	async deleteRundown(...args: ServerArgs<'deleteRundown'>): ServerReturn<'deleteRundown'> {
		return this.invokeServerMethod('deleteRundown', ...args)
	}
	async openRundown(...args: ServerArgs<'openRundown'>): ServerReturn<'openRundown'> {
		return this.invokeServerMethod('openRundown', ...args)
	}
	async closeRundown(...args: ServerArgs<'closeRundown'>): ServerReturn<'closeRundown'> {
		return this.invokeServerMethod('closeRundown', ...args)
	}
	async renameRundown(...args: ServerArgs<'renameRundown'>): ServerReturn<'renameRundown'> {
		return this.invokeServerMethod('renameRundown', ...args)
	}
	async isRundownPlaying(...args: ServerArgs<'isRundownPlaying'>): ServerReturn<'isRundownPlaying'> {
		return this.invokeServerMethod('isRundownPlaying', ...args)
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
}
