import { AppModel } from '@/models/AppModel'

/** Methods that can be called on the server, by the client */
export interface IPCServerMethods {
	triggerAppFeed: () => Promise<void>

	playRundown: (data: { groupId: string; rundownId: string }) => Promise<void>
	queueRundownGroup: (data: { groupId: string; rundownId: string }) => Promise<void>
	unqueueRundownGroup: (data: { groupId: string; rundownId: string }) => Promise<void>
	stopGroup: (data: { groupId: string }) => Promise<void>
	updateTimelineObj: (data: {
		timelineObjId: string
		enableStart: number
		enableDuration: number
		layer: string | number
	}) => Promise<void>
	newRundown: (data: {
		name: string
		/** The group to create the rundown into. If null; will create a "transparent group" */
		groupId: string | null
	}) => Promise<string>
	newGroup: (data: { name: string }) => Promise<string>
	deleteRundown: (data: { groupId: string; rundownId: string }) => Promise<void>
	deleteGroup: (data: { groupId: string }) => Promise<void>
	newTemplateData: (data: { timelineObjId: string }) => Promise<void>
	updateTemplateData: (data: {
		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}) => Promise<void>
	deleteTemplateData: (data: { timelineObjId: string; key: string }) => Promise<void>
	deleteTimelineObj: (data: { timelineObjId: string }) => Promise<void>
	addMediaToTimeline: (data: { groupId: string; rundownId: string; layerId: string; filename: string }) => Promise<void>
	addTemplateToTimeline: (data: {
		groupId: string
		rundownId: string
		layerId: string
		filename: string
	}) => Promise<void>
	toggleGroupLoop: (data: { groupId: string; value: boolean }) => Promise<void>
	toggleGroupAutoplay: (data: { groupId: string; value: boolean }) => Promise<void>
	refreshMedia: () => Promise<void>
	refreshTemplates: () => Promise<void>
}
export interface IPCClientMethods {
	appFeed: (data: AppModel) => void
}
