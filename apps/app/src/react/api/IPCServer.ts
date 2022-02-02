import { IPCServerMethods } from '../../ipc/IPCAPI'
import { TimelineObj } from '../../models/rundown/TimelineObj'
import { Group } from '../../models/rundown/Group'
import { Project } from '../../models/project/Project'
import { Part } from '../../models/rundown/Part'

/** This class is used client-side, to send requests to the server */
export class IPCServer implements IPCServerMethods {
	constructor(private ipcRenderer: Electron.IpcRenderer) {}

	private async invokeServerMethod(methodname: string, ...args: any[]): Promise<any> {
		return this.ipcRenderer.invoke(methodname, ...args)
	}

	triggerSendAll(): Promise<void> {
		return this.invokeServerMethod('triggerSendAll')
	}
	triggerSendRundown(data: { rundownId: string }): Promise<void> {
		return this.invokeServerMethod('triggerSendRundown', data)
	}

	playPart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('playPart', data)
	}
	queuePartGroup(data: { groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('queuePartGroup', data)
	}
	unqueuePartGroup(data: { groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('unqueuePartGroup', data)
	}
	stopGroup(data: { rundownId: string; groupId: string }): Promise<void> {
		return this.invokeServerMethod('stopGroup', data)
	}
	updateTimelineObj(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}): Promise<void> {
		return this.invokeServerMethod('updateTimelineObj', data)
	}
	newPart(data: {
		rundownId: string

		name: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
	}): Promise<string> {
		return this.invokeServerMethod('newPart', data)
	}
	updatePart(data: { rundownId: string; groupId: string; partId: string; part: Part }): Promise<void> {
		return this.invokeServerMethod('updatePart', data)
	}
	newGroup(data: { rundownId: string; name: string }): Promise<string> {
		return this.invokeServerMethod('newGroup', data)
	}
	deletePart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('deletePart', data)
	}
	deleteGroup(data: { rundownId: string; groupId: string }): Promise<void> {
		return this.invokeServerMethod('deleteGroup', data)
	}
	movePart(data: {
		from: { rundownId: string; groupId: string; partId: string }
		to: { rundownId: string; groupId: string | null; position: number }
	}): Promise<Group | undefined> {
		return this.invokeServerMethod('movePart', data)
	}
	newTemplateData(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<void> {
		return this.invokeServerMethod('newTemplateData', data)
	}
	updateTemplateData(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}): Promise<void> {
		return this.invokeServerMethod('updateTemplateData', data)
	}
	deleteTemplateData(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		key: string
	}): Promise<void> {
		return this.invokeServerMethod('deleteTemplateData', data)
	}
	deleteTimelineObj(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<void> {
		return this.invokeServerMethod('deleteTimelineObj', data)
	}
	addResourceToTimeline(data: {
		rundownId: string
		groupId: string
		partId: string
		layerId: string
		resourceId: string
	}): Promise<void> {
		return this.invokeServerMethod('addResourceToTimeline', data)
	}
	toggleGroupLoop(data: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupLoop', data)
	}
	toggleGroupAutoplay(data: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupAutoplay', data)
	}
	refreshResources(): Promise<void> {
		return this.invokeServerMethod('refreshResources')
	}
	refreshTemplates(): Promise<void> {
		return this.invokeServerMethod('refreshTemplates')
	}
	updateProject(data: { id: string; project: Project }): Promise<void> {
		return this.invokeServerMethod('updateProject', data)
	}
}
