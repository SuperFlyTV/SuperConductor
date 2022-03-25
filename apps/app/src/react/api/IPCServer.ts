import { IPCServerMethods } from '../../ipc/IPCAPI'
import { TimelineObj } from '../../models/rundown/TimelineObj'
import { Group } from '../../models/rundown/Group'
import { Project } from '../../models/project/Project'
import { Part } from '../../models/rundown/Part'
import { ActiveTrigger, Trigger } from '../../models/rundown/Trigger'

/** This class is used client-side, to send requests to the server */
export class IPCServer implements IPCServerMethods {
	constructor(private ipcRenderer: Electron.IpcRenderer) {}

	private async invokeServerMethod(methodname: string, ...args: any[]): Promise<any> {
		// Stringifying and parsing data will convert Mobx observable objects into object literals.
		// Otherwise, Electron won't be able to clone it.
		return this.ipcRenderer.invoke(methodname, ...JSON.parse(JSON.stringify(args)))
	}

	triggerSendAll(): Promise<void> {
		return this.invokeServerMethod('triggerSendAll')
	}
	triggerSendRundown(data: { rundownId: string }): Promise<void> {
		return this.invokeServerMethod('triggerSendRundown', data)
	}

	setKeyboardKeys(activeKeys: ActiveTrigger[]): Promise<void> {
		return this.invokeServerMethod('setKeyboardKeys', activeKeys)
	}

	acknowledgeSeenVersion(): Promise<void> {
		return this.invokeServerMethod('acknowledgeSeenVersion')
	}
	playPart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('playPart', data)
	}
	stopPart(data: { rundownId: string; groupId: string; partId: string }): Promise<void> {
		return this.invokeServerMethod('stopPart', data)
	}
	setPartTrigger(data: {
		rundownId: string
		groupId: string
		partId: string
		trigger: Trigger | null
		triggerIndex: number | null
	}): Promise<void> {
		return this.invokeServerMethod('setPartTrigger', data)
	}
	togglePartLoop(data: { rundownId: string; groupId: string; partId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('togglePartLoop', data)
	}
	togglePartDisable(data: { rundownId: string; groupId: string; partId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('togglePartDisable', data)
	}
	togglePartLock(data: { rundownId: string; groupId: string; partId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('togglePartLock', data)
	}
	stopGroup(data: { rundownId: string; groupId: string }): Promise<void> {
		return this.invokeServerMethod('stopGroup', data)
	}
	playGroup(data: { rundownId: string; groupId: string }): Promise<unknown> {
		return this.invokeServerMethod('playGroup', data)
	}
	playNext(data: { rundownId: string; groupId: string }): Promise<unknown> {
		return this.invokeServerMethod('playNext', data)
	}
	playPrev(data: { rundownId: string; groupId: string }): Promise<unknown> {
		return this.invokeServerMethod('playPrev', data)
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
	moveTimelineObjToNewLayer(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<void> {
		return this.invokeServerMethod('moveTimelineObjToNewLayer', data)
	}
	/**
	 * @returns An object containing the ID of the new part and, conditionally, the ID of the new group (if one was created).
	 */
	newPart(data: {
		rundownId: string

		name: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null
	}): Promise<{ partId: string; groupId?: string }> {
		return this.invokeServerMethod('newPart', data)
	}
	updatePart(data: { rundownId: string; groupId: string; partId: string; part: Part }): Promise<void> {
		return this.invokeServerMethod('updatePart', data)
	}
	newGroup(data: { rundownId: string; name: string }): Promise<string> {
		return this.invokeServerMethod('newGroup', data)
	}
	updateGroup(data: { rundownId: string; groupId: string; group: Group }): Promise<void> {
		return this.invokeServerMethod('updateGroup', data)
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
	addTimelineObj(data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}): Promise<void> {
		return this.invokeServerMethod('addTimelineObj', data)
	}
	addResourceToTimeline(data: {
		rundownId: string
		groupId: string
		partId: string
		/** What layer to insert resource into. null = insert into a new layer */
		layerId: string | null
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
	toggleGroupOneAtATime(data: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupOneAtATime', data)
	}
	toggleGroupDisable(data: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupDisable', data)
	}
	toggleGroupLock(data: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupLock', data)
	}
	toggleGroupCollapse(data: { rundownId: string; groupId: string; value: boolean }): Promise<void> {
		return this.invokeServerMethod('toggleGroupCollapse', data)
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
	newRundown(data: { name: string }): Promise<void> {
		return this.invokeServerMethod('newRundown', data)
	}
	deleteRundown(data: { rundownId: string }): Promise<void> {
		return this.invokeServerMethod('deleteRundown', data)
	}
	openRundown(data: { rundownId: string }): Promise<void> {
		return this.invokeServerMethod('openRundown', data)
	}
	closeRundown(data: { rundownId: string }): Promise<void> {
		return this.invokeServerMethod('closeRundown', data)
	}
	listRundowns(data: {
		projectId: string
	}): Promise<{ fileName: string; version: number; name: string; open: boolean }[]> {
		return this.invokeServerMethod('listRundowns', data)
	}
	renameRundown(data: { rundownId: string; newName: string }): Promise<unknown> {
		return this.invokeServerMethod('renameRundown', data)
	}
}
