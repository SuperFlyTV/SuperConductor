export const APP_FEED_CHANNEL = 'app-feed'
export const PLAY_RUNDOWN_CHANNEL = 'play-rundown'
export const QUEUE_RUNDOWN_GROUP_CHANNEL = 'queue-rundown'
export const UNQUEUE_RUNDOWN_GROUP_CHANNEL = 'unqueue-rundown'
export const STOP_GROUP_CHANNEL = 'stop-group'
export const SELECT_TIMELINE_OBJ_CHANNEL = 'select-timeline-obj'
export const UPDATE_TIMELINE_OBJ_CHANNEL = 'update-timeline-obj'
export const NEW_RUNDOWN_CHANNEL = 'new-rundown'
export const NEW_GROUP_CHANNEL = 'new-group'
export const DELETE_RUNDOWN_CHANNEL = 'delete-rundown'
export const DELETE_GROUP_CHANNEL = 'delete-group'
export const NEW_TEMPLATE_DATA_CHANNEL = 'new-template-data'
export const UPDATE_TEMPLATE_DATA_CHANNEL = 'update-template-data'
export const DELETE_TEMPLATE_DATA_CHANNEL = 'delete-template-data'
export const DELETE_TIMELINE_OBJ_CHANNEL = 'delete-timeline-obj'
export const ADD_MEDIA_TO_TIMELINE_CHANNEL = 'add-media-to-timeline'
export const ADD_TEMPLATE_TO_TIMELINE_CHANNEL = 'add-template-to-timeline'
export const TOGGLE_GROUP_LOOP_CHANNEL = 'toggle-group-loop'
export const TOGGLE_GROUP_AUTOPLAY_CHANNEL = 'toggle-group-auto-play'
export const REFRESH_MEDIA_CHANNEL = 'refresh-media'
export const REFRESH_TEMPLATES_CHANNEL = 'refresh-templates'

export interface IPlayRundown {
	groupId: string
	rundownId: string
}
export interface IQueueRundown {
	groupId: string
	rundownId: string
}

export interface IUpdateTimelineObj {
	timelineObjId: string
	enableStart: number
	enableDuration: number
	layer: string | number
}

export interface INewRundown {
	name: string
	/** The group to create the rundown into. If null; will create a "transparent group" */
	groupId: string | null
}

export interface INewGroup {
	name: string
}

export interface IDeleteRundown {
	groupId: string
	rundownId: string
}

export interface IDeleteGroup {
	groupId: string
}

export interface INewTemplateDataChannel {
	timelineObjId: string
}

export interface IUpdateTemplateDataChannel {
	timelineObjId: string
	key: string
	changedItemId: string
	value: string
}

export interface IDeleteTemplateDataChannel {
	timelineObjId: string
	key: string
}

export interface IDeleteTimelineObjChannel {
	timelineObjId: string
}

export interface IAddMediaToTimelineChannel {
	groupId: string
	rundownId: string
	layerId: string
	filename: string
}

export interface IAddTemplateToTimelineChannel {
	groupId: string
	rundownId: string
	layerId: string
	filename: string
}

export interface IToggleGroupLoop {
	groupId: string
	value: boolean
}
export interface IToggleAutoPlayLoop {
	groupId: string
	value: boolean
}
