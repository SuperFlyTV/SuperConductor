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

	playPart(data: { groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('playPart', data)
	}
	queuePartGroup(data: { groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('queuePartGroup', data)
	}
	unqueuePartGroup(data: { groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('unqueuePartGroup', data)
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
	newPart(data: {
		name: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
	}): Promise<string> {
		return this.invokeServerMethod('newPart', data)
	}
	newGroup(data: { name: string }): Promise<string> {
		return this.invokeServerMethod('newGroup', data)
	}
	deletePart(data: { groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('deletePart', data)
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
	addMediaToTimeline(data: { groupId: string; partId: string; layerId: string; filename: string }): Promise<void> {
		return this.invokeServerMethod('addMediaToTimeline', data)
	}
	addTemplateToTimeline(data: { groupId: string; partId: string; layerId: string; filename: string }): Promise<void> {
		return this.invokeServerMethod('addTemplateToTimeline', data)
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
