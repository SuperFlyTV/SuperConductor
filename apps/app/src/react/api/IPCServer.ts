import { IPCServerMethods } from '../../ipc/IPCAPI'

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
		return this.ipcRenderer.invoke(methodname, ...JSON.parse(JSON.stringify(args)))
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

	acknowledgeSeenVersion(...args: ServerArgs<'acknowledgeSeenVersion'>) {
		return this.invokeServerMethod('acknowledgeSeenVersion', ...args)
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
	togglePartLoop(...args: ServerArgs<'togglePartLoop'>) {
		return this.invokeServerMethod('togglePartLoop', ...args)
	}
	togglePartDisable(...args: ServerArgs<'togglePartDisable'>) {
		return this.invokeServerMethod('togglePartDisable', ...args)
	}
	togglePartLock(...args: ServerArgs<'togglePartLock'>) {
		return this.invokeServerMethod('togglePartLock', ...args)
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
	updatePart(...args: ServerArgs<'updatePart'>) {
		return this.invokeServerMethod('updatePart', ...args)
	}
	newGroup(...args: ServerArgs<'newGroup'>) {
		return this.invokeServerMethod('newGroup', ...args)
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
	movePart(...args: ServerArgs<'movePart'>) {
		return this.invokeServerMethod('movePart', ...args)
	}
	duplicatePart(...args: ServerArgs<'duplicatePart'>) {
		return this.invokeServerMethod('duplicatePart', ...args)
	}
	moveGroup(...args: ServerArgs<'moveGroup'>) {
		return this.invokeServerMethod('moveGroup', ...args)
	}
	duplicateGroup(...args: ServerArgs<'duplicateGroup'>) {
		return this.invokeServerMethod('duplicateGroup', ...args)
	}
	newTemplateData(...args: ServerArgs<'newTemplateData'>) {
		return this.invokeServerMethod('newTemplateData', ...args)
	}
	updateTemplateData(...args: ServerArgs<'updateTemplateData'>) {
		return this.invokeServerMethod('updateTemplateData', ...args)
	}
	deleteTemplateData(...args: ServerArgs<'deleteTemplateData'>) {
		return this.invokeServerMethod('deleteTemplateData', ...args)
	}
	deleteTimelineObj(...args: ServerArgs<'deleteTimelineObj'>) {
		return this.invokeServerMethod('deleteTimelineObj', ...args)
	}
	addTimelineObj(...args: ServerArgs<'addTimelineObj'>) {
		return this.invokeServerMethod('addTimelineObj', ...args)
	}
	addResourceToTimeline(...args: ServerArgs<'addResourceToTimeline'>) {
		return this.invokeServerMethod('addResourceToTimeline', ...args)
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
	toggleGroupCollapse(...args: ServerArgs<'toggleGroupCollapse'>) {
		return this.invokeServerMethod('toggleGroupCollapse', ...args)
	}
	refreshResources(...args: ServerArgs<'refreshResources'>) {
		return this.invokeServerMethod('refreshResources', ...args)
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
}
