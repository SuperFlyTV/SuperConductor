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

	log(...args: ServerArgs<'log'>) {
		return this.invokeServerMethod('log', ...args)
	}
	handleClientError(...args: ServerArgs<'handleClientError'>) {
		return this.invokeServerMethod('handleClientError', ...args)
	}
	debugThrowError(...args: ServerArgs<'debugThrowError'>) {
		return this.invokeServerMethod('debugThrowError', ...args)
	}
	triggerSendAll(...args: ServerArgs<'triggerSendAll'>) {
		return this.invokeServerMethod('triggerSendAll', ...args)
	}
	triggerSendRundown(...args: ServerArgs<'triggerSendRundown'>) {
		return this.invokeServerMethod('triggerSendRundown', ...args)
	}

	setKeyboardKeys(...args: ServerArgs<'setKeyboardKeys'>) {
		return this.invokeServerMethod('setKeyboardKeys', ...args)
	}
	makeDevData(...args: ServerArgs<'makeDevData'>) {
		return this.invokeServerMethod('makeDevData', ...args)
	}

	acknowledgeSeenVersion(...args: ServerArgs<'acknowledgeSeenVersion'>) {
		return this.invokeServerMethod('acknowledgeSeenVersion', ...args)
	}
	acknowledgeUserAgreement(...args: ServerArgs<'acknowledgeUserAgreement'>) {
		return this.invokeServerMethod('acknowledgeUserAgreement', ...args)
	}
	updateGUISelection(...args: ServerArgs<'updateGUISelection'>) {
		return this.invokeServerMethod('updateGUISelection', ...args)
	}
	playPart(...args: ServerArgs<'playPart'>) {
		return this.invokeServerMethod('playPart', ...args)
	}
	pausePart(...args: ServerArgs<'pausePart'>) {
		return this.invokeServerMethod('pausePart', ...args)
	}
	stopPart(...args: ServerArgs<'stopPart'>) {
		return this.invokeServerMethod('stopPart', ...args)
	}
	setPartTrigger(...args: ServerArgs<'setPartTrigger'>) {
		return this.invokeServerMethod('setPartTrigger', ...args)
	}
	stopGroup(...args: ServerArgs<'stopGroup'>) {
		return this.invokeServerMethod('stopGroup', ...args)
	}
	playGroup(...args: ServerArgs<'playGroup'>) {
		return this.invokeServerMethod('playGroup', ...args)
	}
	pauseGroup(...args: ServerArgs<'pauseGroup'>) {
		return this.invokeServerMethod('pauseGroup', ...args)
	}
	playNext(...args: ServerArgs<'playNext'>) {
		return this.invokeServerMethod('playNext', ...args)
	}
	playPrev(...args: ServerArgs<'playPrev'>) {
		return this.invokeServerMethod('playPrev', ...args)
	}
	updateTimelineObj(...args: ServerArgs<'updateTimelineObj'>) {
		return this.invokeServerMethod('updateTimelineObj', ...args)
	}
	moveTimelineObjToNewLayer(...args: ServerArgs<'moveTimelineObjToNewLayer'>) {
		return this.invokeServerMethod('moveTimelineObjToNewLayer', ...args)
	}
	/**
	 * @returns An object containing the ID of the new part and, conditionally, the ID of the new group (if one was created).
	 */
	newPart(...args: ServerArgs<'newPart'>) {
		return this.invokeServerMethod('newPart', ...args)
	}
	insertParts(...args: ServerArgs<'insertParts'>) {
		return this.invokeServerMethod('insertParts', ...args)
	}
	updatePart(...args: ServerArgs<'updatePart'>) {
		return this.invokeServerMethod('updatePart', ...args)
	}
	newGroup(...args: ServerArgs<'newGroup'>) {
		return this.invokeServerMethod('newGroup', ...args)
	}
	insertGroups(...args: ServerArgs<'insertGroups'>) {
		return this.invokeServerMethod('insertGroups', ...args)
	}
	updateGroup(...args: ServerArgs<'updateGroup'>) {
		return this.invokeServerMethod('updateGroup', ...args)
	}
	deletePart(...args: ServerArgs<'deletePart'>) {
		return this.invokeServerMethod('deletePart', ...args)
	}
	deleteGroup(...args: ServerArgs<'deleteGroup'>) {
		return this.invokeServerMethod('deleteGroup', ...args)
	}
	moveParts(...args: ServerArgs<'moveParts'>) {
		return this.invokeServerMethod('moveParts', ...args)
	}
	duplicatePart(...args: ServerArgs<'duplicatePart'>) {
		return this.invokeServerMethod('duplicatePart', ...args)
	}
	moveGroups(...args: ServerArgs<'moveGroups'>) {
		return this.invokeServerMethod('moveGroups', ...args)
	}
	duplicateGroup(...args: ServerArgs<'duplicateGroup'>) {
		return this.invokeServerMethod('duplicateGroup', ...args)
	}
	deleteTimelineObj(...args: ServerArgs<'deleteTimelineObj'>) {
		return this.invokeServerMethod('deleteTimelineObj', ...args)
	}
	insertTimelineObjs(...args: ServerArgs<'insertTimelineObjs'>) {
		return this.invokeServerMethod('insertTimelineObjs', ...args)
	}
	addResourcesToTimeline(...args: ServerArgs<'addResourcesToTimeline'>) {
		return this.invokeServerMethod('addResourcesToTimeline', ...args)
	}
	toggleGroupLoop(...args: ServerArgs<'toggleGroupLoop'>) {
		return this.invokeServerMethod('toggleGroupLoop', ...args)
	}
	toggleGroupAutoplay(...args: ServerArgs<'toggleGroupAutoplay'>) {
		return this.invokeServerMethod('toggleGroupAutoplay', ...args)
	}
	toggleGroupOneAtATime(...args: ServerArgs<'toggleGroupOneAtATime'>) {
		return this.invokeServerMethod('toggleGroupOneAtATime', ...args)
	}
	toggleGroupDisable(...args: ServerArgs<'toggleGroupDisable'>) {
		return this.invokeServerMethod('toggleGroupDisable', ...args)
	}
	toggleGroupLock(...args: ServerArgs<'toggleGroupLock'>) {
		return this.invokeServerMethod('toggleGroupLock', ...args)
	}
	refreshResources(...args: ServerArgs<'refreshResources'>) {
		return this.invokeServerMethod('refreshResources', ...args)
	}
	refreshResourcesSetAuto(...args: ServerArgs<'refreshResourcesSetAuto'>) {
		return this.invokeServerMethod('refreshResourcesSetAuto', ...args)
	}
	triggerHandleAutoFill(...args: ServerArgs<'triggerHandleAutoFill'>) {
		return this.invokeServerMethod('triggerHandleAutoFill', ...args)
	}
	updateProject(...args: ServerArgs<'updateProject'>) {
		return this.invokeServerMethod('updateProject', ...args)
	}
	newRundown(...args: ServerArgs<'newRundown'>) {
		return this.invokeServerMethod('newRundown', ...args)
	}
	deleteRundown(...args: ServerArgs<'deleteRundown'>) {
		return this.invokeServerMethod('deleteRundown', ...args)
	}
	openRundown(...args: ServerArgs<'openRundown'>) {
		return this.invokeServerMethod('openRundown', ...args)
	}
	closeRundown(...args: ServerArgs<'closeRundown'>) {
		return this.invokeServerMethod('closeRundown', ...args)
	}
	listRundowns(...args: ServerArgs<'listRundowns'>) {
		return this.invokeServerMethod('listRundowns', ...args)
	}
	renameRundown(...args: ServerArgs<'renameRundown'>) {
		return this.invokeServerMethod('renameRundown', ...args)
	}
	isRundownPlaying(...args: ServerArgs<'isRundownPlaying'>) {
		return this.invokeServerMethod('isRundownPlaying', ...args)
	}
	createMissingMapping(...args: ServerArgs<'createMissingMapping'>) {
		return this.invokeServerMethod('createMissingMapping', ...args)
	}
	isTimelineObjPlaying(...args: ServerArgs<'isTimelineObjPlaying'>) {
		return this.invokeServerMethod('isTimelineObjPlaying', ...args)
	}
	addPeripheralArea(...args: ServerArgs<'addPeripheralArea'>) {
		return this.invokeServerMethod('addPeripheralArea', ...args)
	}
	removePeripheralArea(...args: ServerArgs<'removePeripheralArea'>) {
		return this.invokeServerMethod('removePeripheralArea', ...args)
	}
	updatePeripheralArea(...args: ServerArgs<'updatePeripheralArea'>) {
		return this.invokeServerMethod('updatePeripheralArea', ...args)
	}
	assignAreaToGroup(...args: ServerArgs<'assignAreaToGroup'>) {
		return this.invokeServerMethod('assignAreaToGroup', ...args)
	}
	startDefiningArea(...args: ServerArgs<'startDefiningArea'>) {
		return this.invokeServerMethod('startDefiningArea', ...args)
	}
	finishDefiningArea(...args: ServerArgs<'finishDefiningArea'>) {
		return this.invokeServerMethod('finishDefiningArea', ...args)
	}
	setProjectTrigger(...args: ServerArgs<'setProjectTrigger'>) {
		return this.invokeServerMethod('setProjectTrigger', ...args)
	}
}
