import { IPCServerMethods } from '@/ipc/IPCAPI'

/** This class is used client-side, to send requests to the server */
export class IPCServer implements IPCServerMethods {
	constructor(private ipcRenderer: Electron.IpcRenderer) {}

	private async invokeServerMethod(methodname: string, ...args: any[]): Promise<any> {
		return this.ipcRenderer.invoke(methodname, ...args)
	}

	triggerAppFeed(): Promise<void> {
		return this.invokeServerMethod('triggerAppFeed')
	}

	playRundown(data: { groupId: string; rundownId: string }): Promise<void> {
		return this.invokeServerMethod('playRundown', data)
	}
	queueRundownGroup(data: { groupId: string; rundownId: string }): Promise<void> {
		return this.invokeServerMethod('queueRundownGroup', data)
	}
	unqueueRundownGroup(data: { groupId: string; rundownId: string }): Promise<void> {
		return this.invokeServerMethod('unqueueRundownGroup', data)
	}
	stopGroup(data: { groupId: string }): Promise<void> {
		return this.invokeServerMethod('stopGroup', data)
	}
	updateTimelineObj(data: {
		timelineObjId: string
		enableStart: number
		enableDuration: number
		layer: string | number
	}): Promise<void> {
		return this.invokeServerMethod('updateTimelineObj', data)
	}
	newRundown(data: {
		name: string
		/** The group to create the rundown into. If null; will create a "transparent group" */
		groupId: string | null
	}): Promise<string> {
		return this.invokeServerMethod('newRundown', data)
	}
	newGroup(data: { name: string }): Promise<string> {
		return this.invokeServerMethod('newGroup', data)
	}
	deleteRundown(data: { groupId: string; rundownId: string }): Promise<void> {
		return this.invokeServerMethod('deleteRundown', data)
	}
	deleteGroup(data: { groupId: string }): Promise<void> {
		return this.invokeServerMethod('deleteGroup', data)
	}
	newTemplateData(data: { timelineObjId: string }): Promise<void> {
		return this.invokeServerMethod('newTemplateData', data)
	}
	updateTemplateData(data: {
		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}): Promise<void> {
		return this.invokeServerMethod('updateTemplateData', data)
	}
	deleteTemplateData(data: { timelineObjId: string; key: string }): Promise<void> {
		return this.invokeServerMethod('deleteTemplateData', data)
	}
	deleteTimelineObj(data: { timelineObjId: string }): Promise<void> {
		return this.invokeServerMethod('deleteTimelineObj', data)
	}
	addMediaToTimeline(data: { groupId: string; rundownId: string; layerId: string; filename: string }): Promise<void> {
		return this.invokeServerMethod('addMediaToTimeline', data)
	}
	addTemplateToTimeline(data: {
		groupId: string
		rundownId: string
		layerId: string
		filename: string
	}): Promise<void> {
		return this.invokeServerMethod('})', data)
	}
	toggleGroupLoop(data: { groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupLoop', data)
	}
	toggleGroupAutoplay(data: { groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupAutoplay', data)
	}
	refreshMedia(): Promise<void> {
		return this.invokeServerMethod('refreshMedia')
	}
	refreshTemplates(): Promise<void> {
		return this.invokeServerMethod('refreshTemplates')
	}
}
